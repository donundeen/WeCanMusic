float mapToCurve(float input, float breakpoints[][2], int numBreakpoints, String curveType) {
    float x = input; // Assuming input is between 0.0 and 1.0
    float y = 0.0;

    for (int i = 0; i < numBreakpoints - 1; i++) {
        float x1 = breakpoints[i][0];
        float y1 = breakpoints[i][1];
        float x2 = breakpoints[i + 1][0];
        float y2 = breakpoints[i + 1][1];

        if (x >= x1 && x <= x2) {
            float t = (x - x1) / (x2 - x1);
            if (curveType == "logarithmic") {
                y = y1 + (y2 - y1) * log10(t + 1) / log10(2);
            } else if (curveType == "exponential") {
                y = y1 + (y2 - y1) * (exp(t) - 1) / (exp(1) - 1);
            } else {
                y = y1 + t * (y2 - y1); // Linear as default
            }
            break;
        }
    }

    return y;
}

void setup() {
    Serial.begin(9600);
}

void loop() {
    if (Serial.available() > 0) {
        float input = Serial.parseFloat();
        int numBreakpoints = Serial.parseInt();
        float breakpoints[numBreakpoints][2];
        for (int i = 0; i < numBreakpoints; i++) {
            breakpoints[i][0] = Serial.parseFloat();
            breakpoints[i][1] = Serial.parseFloat();
        }
        String curveType = Serial.readStringUntil('\n');

        float output = mapToCurve(input, breakpoints, numBreakpoints, curveType);
        Serial.println(output);
    }
}
