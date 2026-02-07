/**
 * SensorStream
 *
 * Handles a stream of single-value sensor data (int or float), possibly fast and
 * irregular. Range is unknown in advance. Outliers beyond a cap are ignored.
 * All outputs are 0.0–1.0 with dynamically determined min/max.
 *
 * Config (constructor options):
 *   capRatio       - nudge for dynamic range = range * capRatio (default 0.5)
 *   sentinelHigh   - ignore input >= this (default 2e9)
 *   sentinelLow    - ignore input <= this (default -2e9)
 *   smoothingAlpha - EMA: 0=no smooth, 1=no change (default 0.3)
 *   smoothingWindow - if > 0, use sliding-window average over this many samples
 *   minDtMs        - minimum dt (ms) for rate of change (default 1)
 *   peakThreshold  - scaled value above this counts as peak (default 0.7)
 *   minPeakGapMs   - ignore peaks closer than this (ms) (default 100)
 *   peakLookback   - require local max over this many samples (0 = threshold only)
 *   maxGapMs       - cap for "space between peaks" scaling (default 2000)
 *
 * Outputs (all 0.0–1.0): raw, smoothed, rateOfChange, peak, spaceBetweenPeaks, rms, peakAmplitude.
 */

const DynRescale = require("./dynRescale.module");
const FunctionCurve = require("./functionCurve.module");

module.exports = class SensorStream {
  constructor(options = {}) {
    this.db = options.db || false;

    // ----- Config: scaling & outliers -----
    /** Cap ratio for raw and for rate-of-change (nudge = range * capRatio). Use cappedScale so one crazy value doesn't blow min/max. */
    this.capRatio = options.capRatio != null ? options.capRatio : 0.1;
    /** If set, inputs with value >= this or <= sentinelMin are ignored (e.g. 2e9 for INT32_MAX). */
    this.sentinelHigh = options.sentinelHigh != null ? options.sentinelHigh : 2e9;
    this.sentinelLow = options.sentinelLow != null ? options.sentinelLow : -2e9;

    // ----- Config: smoothing -----
    /** EMA smoothing: 0 = no smoothing, 1 = no change. New = alpha * new + (1-alpha) * prev. */
    this.smoothingAlpha = options.smoothingAlpha != null ? options.smoothingAlpha : 0.3;
    /** If true, use a sliding-window average instead of EMA; window size = smoothingWindow. */
    this.smoothingWindow = options.smoothingWindow != null ? options.smoothingWindow : 0;

    // ----- Config: rate of change -----
    /** Minimum dt (ms) for rate calculation to avoid huge spikes. */
    this.minDtMs = options.minDtMs != null ? options.minDtMs : 1;

    // ----- Config: peak detection -----
    /** Scaled value (0–1) must be above this to count as a peak. */
    this.peakThreshold = options.peakThreshold != null ? options.peakThreshold : 0.7;
    /** Minimum time (ms) between peaks; peaks closer than this are ignored. */
    this.minPeakGapMs = options.minPeakGapMs != null ? options.minPeakGapMs : 100;
    /** Optional: number of samples to look back for "local max" (0 = use threshold only). */
    this.peakLookback = options.peakLookback != null ? options.peakLookback : 0;

    // ----- Config: space between peaks -----
    /** Max gap (ms) to use for scaling "space between peaks" to 0–1 (observed max is still dynamic). */
    this.maxGapMs = options.maxGapMs != null ? options.maxGapMs : 2000;

    // ----- Internal state -----
    this._rawScale = new DynRescale({ db: this.db });
    this._rawScale.name = "rawScale";
    this._rateScale = new DynRescale({ db: this.db });
    this._rateScale.name = "rateScale";
    this._gapScale = new DynRescale({ db: this.db });
    this._gapScale.name = "gapScale";

    this._rateCurve = new FunctionCurve({dir:"up",lowerThreshold:0,upperThreshold:1,logScale:-0.65}, {db: this.db});
    this._firstRead = true;
    this._prevRaw = null;
    this._prevScaledValue = null;
    this._prevTime = null;
    this._smoothedRaw = null;
    this._lastPeakTime = null;
    this._lastPeakValue = null;
    this._rising = false;
    this._buffer = [];        // for smoothingWindow or peakLookback (sample count)
    this._bufferMaxSize = Math.max(this.smoothingWindow, this.peakLookback, 1);

    // ----- Outputs (0.0–1.0) -----
    this.scaledValue = 0;
    this.smoothed = 0;
    this.rateOfChange = 0;
    this.peak = 0;            // 1 at peak, 0 otherwise (or could be confidence)
    this.spaceBetweenPeaks = 0;  // 0 = just had a peak, 1 = long time since peak
    this.rms = 0;             // rolling RMS of recent values (scaled 0–1)
    this.peakAmplitude = 0;   // height of last peak (scaled 0–1)
  }

  /**
   * Push a single value. Optional timestamp in ms (default: Date.now()).
   * Returns this instance for chaining.
   */
  push(value, timestamp) {
    const t = timestamp != null ? timestamp : Date.now();
    const v = Number(value);

    if (v >= this.sentinelHigh || v <= this.sentinelLow) {
      this.db?.log?.("SensorStream push sentinel ignored", v);
      return this;
    }

    if (this._firstRead) {
      this._prevRaw = v;
      this._prevTime = t;
      this._smoothedRaw = v;
      this._rawScale.reset();
      this._rateScale.reset();
      this._gapScale.reset();
      this._firstRead = false;
      this._buffer = [v];
      this.scaledValue = 0;
      this.smoothed = 0;
      this.rateOfChange = 0;
      this.peak = 0;
      this.spaceBetweenPeaks = 0;
      this.rms = 0;
      this.peakAmplitude = 0;
      return this;
    }

    // ----- Raw scaled 0–1 (capped to avoid outlier blowing range) -----
    const rawScaled = this._rawScale.cappedScale(v, 0, 1, this.capRatio);
    this.scaledValue = rawScaled;

    // ----- Buffer for windowed smoothing, RMS, peak lookback -----
    this._buffer.push(v);
    if (this._buffer.length > this._bufferMaxSize) this._buffer.shift();

    // ----- Smoothed (EMA or windowed average) -----
    if (this.smoothingWindow > 0) {
      const n = Math.min(this._buffer.length, this.smoothingWindow);
      const sum = this._buffer.slice(-n).reduce((a, b) => a + b, 0);
      this._smoothedRaw = sum / n;
    } else {
      this._smoothedRaw = this.smoothingAlpha * v + (1 - this.smoothingAlpha) * this._smoothedRaw;
    }
    this.smoothed = this._rawScale.cappedScale(this._smoothedRaw, 0, 1, this.capRatio);

    // ----- Rate of change (delta per ms), scaled 0–1 -----
    const dt = Math.max(t - this._prevTime, this.minDtMs);
    const delta = Math.abs(this.scaledValue - this._prevScaledValue);
    const rate = delta / dt;
    this.rateOfChange = this._rateScale.cappedScale(rate, 0, 1, this.capRatio);
    this.rateOfChange = this._rateCurve.mapValue(this.rateOfChange);

    // ----- Peak detection -----
    this.peak = 0;
    const gapSinceLastPeak = this._lastPeakTime == null ? this.maxGapMs : t - this._lastPeakTime;
    if (rawScaled >= this.peakThreshold && gapSinceLastPeak >= this.minPeakGapMs) {
      let isPeak = true;
      if (this.peakLookback > 0 && this._buffer.length >= this.peakLookback + 1) {
        const cur = v;
        const back = this._buffer.slice(-this.peakLookback - 1, -1);
        isPeak = back.every((b) => b <= cur);
      }
      if (isPeak) {
        this.peak = 1;
        this._lastPeakTime = t;
        this._lastPeakValue = rawScaled;
      }
    }

    // ----- Space between peaks: time since last peak, scaled 0–1 -----
    const gapMs = this._lastPeakTime == null ? this.maxGapMs : Math.min(t - this._lastPeakTime, this.maxGapMs);
    this.spaceBetweenPeaks = this._gapScale.cappedScale(gapMs, 0, 1, this.capRatio);

    // ----- RMS of recent raw (optional gestural) -----
    if (this._buffer.length >= 2) {
      const mean = this._buffer.reduce((a, b) => a + b, 0) / this._buffer.length;
      const sq = this._buffer.reduce((acc, x) => acc + (x - mean) ** 2, 0);
      const rmsRaw = Math.sqrt(sq / this._buffer.length);
      this.rms = this._rawScale.cappedScale(rmsRaw, 0, 1, this.capRatio);
    } else {
      this.rms = this.scaledValue;
    }

    // ----- Peak amplitude: height of last peak (for decay display) -----
    this.peakAmplitude = this._lastPeakValue != null ? this._lastPeakValue : 0;

    this._prevRaw = v;
    this._prevScaledValue = this.scaledValue;
    this._prevTime = t;
    //this.db?.log?.("stream: **************************************************");
    //this.db?.log?.("stream: sensorStream.push done: ", v, this.scaledValue, this.smoothed, this.rateOfChange, this.peak, this.spaceBetweenPeaks, this.rms, this.peakAmplitude);
    //this.db?.log?.("stream: sensorStream.push rateOfChange: ", this.rateOfChange,this._rateScale.min,this._rateScale.max);

    //this.db?.log?.("stream: sensorStream.push peak: ", this.peak,this._gapScale.min,this._gapScale.max);
    //this.db?.log?.("stream: sensorStream.push spaceBetweenPeaks: ", this.spaceBetweenPeaks,this._gapScale.min,this._gapScale.max);
    //this.db?.log?.("stream: sensorStream.push rms: ", this.rms,this._rawScale.min,this._rawScale.max);
    //this.db?.log?.("stream: sensorStream.push peakAmplitude: ", this.peakAmplitude,this._lastPeakValue,this._lastPeakTime);

    return this;
  }

  /** Reset all state and scaling (e.g. new gesture). */
  reset() {
    this._firstRead = true;
    this._prevRaw = null;
    this._prevTime = null;
    this._smoothedRaw = null;
    this._lastPeakTime = null;
    this._lastPeakValue = null;
    this._rising = false;
    this._buffer = [];
    this._rawScale.reset();
    this._rateScale.reset();
    this._gapScale.reset();
    this.scaledValue = 0;
    this.smoothed = 0;
    this.rateOfChange = 0;
    this.peak = 0;
    this.spaceBetweenPeaks = 0;
    this.rms = 0;
    this.peakAmplitude = 0;
  }

  /** Return current outputs as a single object (all 0.0–1.0). */
  getOutputs() {
    return {
      scaledValue: this.scaledValue,
      smoothed: this.smoothed,
      rateOfChange: this.rateOfChange,
      peak: this.peak,
      spaceBetweenPeaks: this.spaceBetweenPeaks,
      rms: this.rms,
      peakAmplitude: this.peakAmplitude,
    };
  }
};
    