/*
describe the configuration variables that can be changed from the UI
*/
var uiConfig = {
    conductor:[

        {
            name:"bpm",
            type:"number",
            min:60,
            max:240,
            step:1,
            default:120,
            controllers :[
                {"name":"bpm",
                "type":"slider",},
                {"name":"bpm",
                "type":"int"}
            ],
        },
        {
            name:"quantizeTime",
            type:"array",
            default:["N16", "N83"],
            "options":[
                {value:"WN", name: "Whole"},
                {value:"DWN", name: "Double Whole"}, 
                {value:"HN", name: "Half"}, 
                {value:"HN3", name: "Half Triplet"}, 
                {value:"QN", name: "Quarter"}, 
                {value:"QN3", name: "Quarter Triplet"}, 
                {value:"N8", name: "Eighth"}, 
                {value:"N83", name: "Eighth Triplet"}, 
                {value:"N16", name: "Sixteenth"}
            ],
            controllers :[
                {"name":"quantizeTime",
                "type":"select"}
            ]
        },
    ],
    instrument: [
        {
            name:"midiChannel",
            type:"number",
            min:1,
            max:16,
            step:1,
            default:1,
            controllers :[
               {"name":"midiChannel",
                "type":"int"}
            ],
        },
        {
            name:"midiVoice",
            type:"midiVoice",
            min:1,
            max:128,
            step:1,
            default:1,
            controllers :[
                {"name":"midiVoice",
                "type":"select"}
            ],
        },
        {
            name:"midiRange",
            type:"midiRange",
            min:1,
            max:128,
            step:1,
            default:1,
            controllers :[
                {"name":"midiRange",
                "type":"range",
                "minVar": "midiMin",
                "maxVar": "midiMax"}
            ],
        },
        {
            name:"midiNoteLength",
            type:"midiNoteLength",
            min:1,
            max:128,
            step:1,
            default:1,
            controllers :[
                {"name":"midiNoteLength",
                "type":"select"}
            ],
        },
        {
            name:"midiVolume",
            type:"midiVolume",
            min:0,
            max:128,
            step:1,
            default:1,
            controllers :[
                {"name":"midiVolume",
                "type":"slider"}
            ],
        }
    ],      
    sensorStream : [
        {
            name:"scaledValueCurveOptions",
            type:"array",
            default:[0., 0.0, 0., 1.0, 1.0, 0.0],
            controllers :[
                {"name":"scaledValueCurveOptions",
                "type":"curveEditor"}
            ],
        },
        {
            name:"smoothedCurveOptions",
            type:"array",
            default:[0., 0.0, 0., 1.0, 1.0, 0.0],
            controllers :[
                {"name":"smoothedCurveOptions",
                "type":"curveEditor"}
            ],
        },
        {
            name:"changeRateCurveOptions",
            type:"array",
            default:[0., 0.0, 0., 1.0, 1.0, 0.0],
            controllers :[
                {"name":"changeRateCurveOptions",
                "type":"curveEditor"}
            ],
        },
        {
            name:"peakCurveOptions",
            type:"array",
            default:[0., 0.0, 0., 1.0, 1.0, 0.0],
            controllers :[
                {"name":"peakCurveOptions",
                "type":"curveEditor"}
            ],
        },
        {
            name:"spaceBetweenPeaksCurveOptions",
            type:"array",
            default:[0., 0.0, 0., 1.0, 1.0, 0.0],
            controllers :[
                {"name":"spaceBetweenPeaksCurveOptions",
                "type":"curveEditor"}
            ],
        },
        {
            name:"rmsCurveOptions",
            type:"array",
            default:[0., 0.0, 0., 1.0, 1.0, 0.0],
            controllers :[
                {"name":"rmsCurveOptions",
                "type":"curveEditor"}
            ],
        },
        {
            name:"peakAmplitudeCurveOptions",
            type:"array",
            default:[0., 0.0, 0., 1.0, 1.0, 0.0],
            controllers :[
                {"name":"peakAmplitudeCurveOptions",
                "type":"curveEditor"}
            ],
        },
        {
            name:"rawScaleCapRatio",
            type:"number",
            min:0,
            max:10,
            step:0.1,
            default:1.5,
            controllers :[
                {"name":"rawScaleCapRatio",
                "type":"slider"}
            ], 
        },
        {
            name:"rawScaleShrinkRatio",
            type:"number",
            min:0,
            max:1,
            step:0.01,
            default:0.001,
            controllers :[
                {"name":"rawScaleShrinkRatio",
                "type":"slider"}
            ],
        },
        {
            name:"changeRateScaleCapRatio",
            type:"number",
            min:0,
            max:10,
            step:0.1,
            default:1.5,
            controllers :[
                {"name":"changeRateScaleCapRatio",
                "type":"slider"}
            ],
        },
        {
            name:"changeRateScaleShrinkRatio",
            type:"number",
            min:0,
            max:1,
            step:0.01,
            default:0.001,
            controllers :[
                {"name":"changeRateScaleShrinkRatio",   
                "type":"slider"}
            ],
        },
        {
            name:"gapScaleCapRatio",
            type:"number",
            min:0,
            max:10,
            step:0.1,
            default:1.5,
            controllers :[
                {"name":"gapScaleCapRatio",
                "type":"slider"}
            ],
        },
        {
            name:"gapScaleShrinkRatio",
            type:"number",
            min:0,
            max:1,
            step:0.01,
            default:0.001,
            controllers :[
                {"name":"gapScaleShrinkRatio",
                "type":"slider"}
            ],
        },
        {
            name:"rmsScaleCapRatio",
            type:"number",
            min:0,
            max:10,
            step:0.1,
            default:1.5,
            controllers :[
                {"name":"rmsScaleCapRatio",
                "type":"slider"}
            ],
        },
        {
            name:"rmsScaleShrinkRatio",
            type:"number",
            min:0,
            max:1,
            step:0.01,
            default:0.001,
            controllers :[
                {"name":"rmsScaleShrinkRatio",
                "type":"slider"}
            ],
        },
        {
            name:"peakAmplitudeScaleCapRatio",
            type:"number",
            min:0,
            max:10,
            step:0.1,
            default:1.5,
            controllers :[
                {"name":"peakAmplitudeScaleCapRatio",
                "type":"slider"}
            ],
        },
        {
            name:"peakAmplitudeScaleShrinkRatio",
            type:"number",
            min:0,
            max:1,
            step:0.01,
            default:0.001,
            controllers :[
                {"name":"peakAmplitudeScaleShrinkRatio",
                "type":"slider"}
            ],
        },
    ],
};

module.exports = uiConfig;