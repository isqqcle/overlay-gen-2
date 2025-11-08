(function () {
    const sliderConfigs = [
        { id: "pixelCount", valueId: "pixelCountValue" },
        { id: "pixelHeight", valueId: "pixelHeightValue" },
        { id: "opacityPixels", valueId: "opacityPixelsValue" },
        { id: "opacityText", valueId: "opacityTextValue" },
        { id: "textSize", valueId: "textSizeValue" }
    ];

    const colorPairs = [
        { textId: "colour1Text", inputId: "colour1" },
        { textId: "colour2Text", inputId: "colour2" },
        { textId: "colour3Text", inputId: "colour3" },
        { textId: "colourTextText", inputId: "colourText" }
    ];

    let userChangedTextSize = false;
    let currentTextSize = 40;
    let targetTextSize = 40;
    let animationRunning = false;

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        sliderConfigs.forEach(({ id, valueId }) => {
            const slider = document.getElementById(id);
            const valueBadge = document.getElementById(valueId);
            if (!slider || !valueBadge) {
                return;
            }

            valueBadge.textContent = slider.value;
            updateSliderBackground(slider);

            slider.addEventListener("input", () => {
                valueBadge.textContent = slider.value;
                updateSliderBackground(slider);

                if (id === "pixelCount" || id === "pixelHeight") {
                    updateAutoTextSize();
                }

                if (id !== "textSize") {
                    generateImage();
                }
            });
        });

        const textSizeSlider = document.getElementById("textSize");
        if (textSizeSlider) {
            textSizeSlider.addEventListener("input", () => {
                const textSizeValue = document.getElementById("textSizeValue");
                userChangedTextSize = true;
                const parsed = Number(textSizeSlider.value) || 40;
                currentTextSize = parsed;
                targetTextSize = parsed;
                animationRunning = false;
                if (textSizeValue) {
                    textSizeValue.textContent = Math.round(parsed);
                }
                updateSliderBackground(textSizeSlider);
                generateImage();
            });
        }

        colorPairs.forEach(({ textId, inputId }) => {
            const textInput = document.getElementById(textId);
            const colorInput = document.getElementById(inputId);
            if (!textInput || !colorInput) {
                return;
            }

            textInput.value = colorInput.value.toUpperCase();

            textInput.addEventListener("input", (event) => {
                const value = event.target.value.trim();
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    colorInput.value = value;
                    generateImage();
                }
            });

            colorInput.addEventListener("input", () => {
                textInput.value = colorInput.value.toUpperCase();
                generateImage();
            });
        });

        ["canvasWidth", "canvasHeight"].forEach((id) => {
            const input = document.getElementById(id);
            if (!input) {
                return;
            }
            input.addEventListener("input", updateCanvasLabel);
        });
        updateCanvasLabel();

        const overlayWidthSelect = document.getElementById("overlayWidth");
        if (overlayWidthSelect) {
            overlayWidthSelect.addEventListener("change", generateImage);
        }

        const numberStyleSelect = document.getElementById("numberStyle");
        if (numberStyleSelect) {
            numberStyleSelect.addEventListener("change", generateImage);
        }

        const fontSelect = document.getElementById("fontStyle");
        if (fontSelect) {
            fontSelect.addEventListener("change", () => {
                const fontStyle = getFontStyle();
                const fontSpec = `${fontStyle.style} ${fontStyle.weight} 40px "${fontStyle.family}"`;
                if (document.fonts && document.fonts.load) {
                    document.fonts.load(fontSpec).catch(() => null).finally(generateImage);
                } else {
                    generateImage();
                }
            });
        }

        const resetBtn = document.getElementById("resetBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                setNumber("canvasWidth", 1920);
                setNumber("canvasHeight", 1080);

                setSlider("pixelCount", "pixelCountValue", 9);
                setSlider("pixelHeight", "pixelHeightValue", 8);
                setSlider("opacityPixels", "opacityPixelsValue", 100);
                setSlider("opacityText", "opacityTextValue", 100);
                setSlider("textSize", "textSizeValue", 40);

                setColor("colour1", "colour1Text", "#ffb0c5");
                setColor("colour2", "colour2Text", "#99cdf0");
                setColor("colour3", "colour3Text", "#ffd54f");
                setColor("colourText", "colourTextText", "#000000");

                if (overlayWidthSelect) {
                    overlayWidthSelect.value = "60";
                }
                if (numberStyleSelect) {
                    numberStyleSelect.value = "stacked";
                }
                if (fontSelect) {
                    fontSelect.value = "Inter-400";
                }

                userChangedTextSize = false;
                targetTextSize = 40;
                currentTextSize = 40;
                animationRunning = false;

                updateCanvasLabel();
                generateImage();
                resetBtn.blur();
            });
        }

        const toggleBtn = document.getElementById("toggleTransformBtn");
        const transformModal = document.getElementById("transformModal");
        const closeModal = document.getElementById("closeModal");

        if (toggleBtn && transformModal) {
            toggleBtn.addEventListener("click", () => {
                transformModal.style.display = "flex";
            });
        }

        if (closeModal && transformModal) {
            closeModal.addEventListener("click", () => {
                transformModal.style.display = "none";
            });
        }

        if (transformModal) {
            transformModal.addEventListener("click", (event) => {
                if (event.target === transformModal) {
                    transformModal.style.display = "none";
                }
            });
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && transformModal && transformModal.style.display === "flex") {
                transformModal.style.display = "none";
            }
        });

        updateAutoTextSize();
        generateImage();
    }

    function setNumber(id, value) {
        const input = document.getElementById(id);
        if (!input) {
            return;
        }
        input.value = value;
    }

    function setSlider(id, badgeId, value) {
        const slider = document.getElementById(id);
        const badge = document.getElementById(badgeId);
        if (!slider || !badge) {
            return;
        }
        slider.value = value;
        badge.textContent = value;
        updateSliderBackground(slider);
    }

    function setColor(inputId, textId, value) {
        const colorInput = document.getElementById(inputId);
        const textInput = document.getElementById(textId);
        if (!colorInput || !textInput) {
            return;
        }
        colorInput.value = value;
        textInput.value = value.toUpperCase();
    }

    function updateCanvasLabel() {
        const widthInput = document.getElementById("canvasWidth");
        const heightInput = document.getElementById("canvasHeight");
        const label = document.getElementById("currentCanvas");
        if (!widthInput || !heightInput || !label) {
            return;
        }
        const width = widthInput.value || "0";
        const height = heightInput.value || "0";
        label.textContent = `${width}x${height}`;
        generateImage();
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function mapFromPoints(value, points) {
        if (value >= points[0].h) {
            return points[0].s;
        }
        for (let index = 0; index < points.length - 1; index += 1) {
            const a = points[index];
            const b = points[index + 1];
            if (value <= a.h && value >= b.h) {
                const t = (value - b.h) / (a.h - b.h);
                return Math.round(b.s + t * (a.s - b.s));
            }
        }
        const last = points[points.length - 1];
        const previous = points[points.length - 2];
        const slope = (last.s - previous.s) / (last.h - previous.h);
        return Math.round(last.s + slope * (value - last.h));
    }

    function updateAutoTextSize() {
        if (userChangedTextSize) {
            return;
        }

        const pixelCount = Number((document.getElementById("pixelCount") || {}).value) || 9;
        const pixelHeight = Number((document.getElementById("pixelHeight") || {}).value) || 8;

        const defaultPoints = [
            { h: 8, s: 40 },
            { h: 7, s: 50 },
            { h: 5, s: 70 },
            { h: 2, s: 85 }
        ];

        const mapA = [
            { h: 8, s: 25 },
            { h: 7, s: 30 },
            { h: 5, s: 40 },
            { h: 2, s: 85 }
        ];

        const mapB = [
            { h: 8, s: 20 },
            { h: 7, s: 30 },
            { h: 5, s: 45 },
            { h: 2, s: 85 }
        ];

        if (pixelCount <= 9) {
            if (pixelHeight >= 8) {
                targetTextSize = 40;
            } else {
                targetTextSize = clamp(mapFromPoints(pixelHeight, defaultPoints), 1, 200);
            }
        } else if (pixelCount <= 19) {
            targetTextSize = clamp(mapFromPoints(pixelHeight, mapA), 1, 200);
        } else {
            targetTextSize = clamp(mapFromPoints(pixelHeight, mapB), 1, 200);
        }

        animateTextSize();
    }

    function animateTextSize() {
        if (animationRunning) {
            return;
        }

        animationRunning = true;

        function step() {
            const slider = document.getElementById("textSize");
            const badge = document.getElementById("textSizeValue");
            if (!slider || !badge) {
                animationRunning = false;
                return;
            }

            const ease = 0.1;
            currentTextSize += (targetTextSize - currentTextSize) * ease;

            const rounded = Math.round(currentTextSize);
            slider.value = rounded;
            badge.textContent = rounded;
            updateSliderBackground(slider);

            generateImage();

            if (Math.abs(currentTextSize - targetTextSize) > 0.5) {
                requestAnimationFrame(step);
            } else {
                currentTextSize = targetTextSize;
                slider.value = Math.round(currentTextSize);
                badge.textContent = Math.round(currentTextSize);
                updateSliderBackground(slider);
                animationRunning = false;
            }
        }

        requestAnimationFrame(step);
    }

    function updateSliderBackground(slider) {
        const min = Number(slider.min || 0);
        const max = Number(slider.max || 100);
        const value = Number(slider.value || 0);
        const percent = ((value - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(90deg, var(--accent) ${percent}%, #d9d9d9 ${percent}%)`;
    }

    function getFontStyle() {
        const fontSelect = document.getElementById("fontStyle");
        if (!fontSelect) {
            return { family: "Consolas", weight: "400", style: "normal" };
        }
        const [family, weightStyle] = fontSelect.value.split("-");
        let weight = "400";
        let style = "normal";
        if (weightStyle && weightStyle.endsWith("i")) {
            weight = weightStyle.slice(0, -1);
            style = "italic";
        } else if (weightStyle) {
            weight = weightStyle;
        }
        return { family, weight, style };
    }

    function fitFontToWidth(ctx, text, maxWidth, baseSize, setFont) {
        let size = baseSize;
        setFont(size);
        if (ctx.measureText(text).width <= maxWidth) {
            return size;
        }
        while (size > 1 && ctx.measureText(text).width > maxWidth) {
            size -= 1;
            setFont(size);
        }
        return size;
    }

    function generateImage() {
        const canvasWidth = parseInt((document.getElementById("canvasWidth") || {}).value, 10) || 0;
        const canvasHeight = parseInt((document.getElementById("canvasHeight") || {}).value, 10) || 0;
        let pixels = parseInt((document.getElementById("pixelCount") || {}).value, 10);
        if (!Number.isFinite(pixels) || pixels < 1) {
            pixels = 1;
        }
        const color1 = ((document.getElementById("colour1") || {}).value || "#ffb0c5").toUpperCase();
        const color2 = ((document.getElementById("colour2") || {}).value || "#99cdf0").toUpperCase();
        const color3 = ((document.getElementById("colour3") || {}).value || "#ffd54f").toUpperCase();
        const colorText = ((document.getElementById("colourText") || {}).value || "#000000").toUpperCase();
        const opacityPixels = clamp(parseInt((document.getElementById("opacityPixels") || {}).value, 10) || 0, 0, 100) / 100;
        const opacityText = clamp(parseInt((document.getElementById("opacityText") || {}).value, 10) || 0, 0, 100) / 100;
        const pixelHeightPct = parseInt((document.getElementById("pixelHeight") || {}).value, 10) || 8;
        const overlayWidth = parseInt((document.getElementById("overlayWidth") || {}).value, 10) || 60;
        const numberStyle = ((document.getElementById("numberStyle") || {}).value || "stacked").toLowerCase();
        const textSizeInput = parseInt((document.getElementById("textSize") || {}).value, 10) || 40;

        const canvas = document.getElementById("canvas");
        const downloadBtn = document.getElementById("downloadBtn");

        if (!canvas || canvasWidth <= 0 || canvasHeight <= 0 || pixels <= 0) {
            if (downloadBtn) {
                downloadBtn.disabled = true;
            }
            return;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = 0;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        const blocksWide = Math.max(1, overlayWidth);
        const pixelWidth = Math.max(1, canvasWidth / blocksWide);
        const pixelHeight = Math.max(1, Math.round((canvasHeight * pixelHeightPct) / 100));
        const pixelY = Math.round(canvasHeight / 2 - pixelHeight / 2);
        const fontStyle = getFontStyle();

        const textSizePercent = textSizeInput / 100;
        let desiredFontSize = textSizeInput;
        if (pixelHeightPct < 8) {
            desiredFontSize = Math.max(1, Math.round(pixelHeight * textSizePercent));
        }

        function setFont(size) {
            ctx.font = `${fontStyle.style} ${fontStyle.weight} ${size}px "${fontStyle.family}"`;
        }

        const textInputs = [
            { id: "colour1Text", value: color1 },
            { id: "colour2Text", value: color2 },
            { id: "colour3Text", value: color3 },
            { id: "colourTextText", value: colorText }
        ];
        textInputs.forEach(({ id, value }) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = value.toUpperCase();
            }
        });

        const columns = pixels * 2;
        const centerX = canvasWidth / 2;
        const centerY = pixelY + pixelHeight / 2;

        for (let i = -pixels; i < pixels; i += 1) {
            const pixelX = centerX + i * pixelWidth;

            ctx.globalAlpha = opacityPixels;
            let fillColor = Math.abs(i % 2) === 1 ? color2 : color1;
            const numberValue = i < 0 ? Math.abs(i) : i + 1;
            if (numberValue % 10 === 0) {
                fillColor = color3;
            }
            ctx.fillStyle = fillColor;
            ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);

            ctx.globalAlpha = opacityText;
            ctx.fillStyle = colorText;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (numberValue < 10) {
                setFont(desiredFontSize);
                ctx.fillText(String(numberValue), pixelX + pixelWidth / 2, centerY);
            } else {
                drawStyledNumber(ctx, numberValue, numberStyle, {
                    centerX: pixelX + pixelWidth / 2,
                    centerY,
                    baseSize: desiredFontSize,
                    pixelHeight,
                    pixelWidth,
                    setFont
                });
            }
        }

        ctx.globalAlpha = 1;
        const crosshairWidth = Math.max(1, Math.round(0.003125 * canvasWidth));
        const crosshairX = canvasWidth / 2 - crosshairWidth / 2;
        ctx.fillStyle = "#e8e8e8";
        ctx.fillRect(crosshairX, 0, crosshairWidth, canvasHeight);

        const cropHorizontal = document.getElementById("cropHorizontal");
        const cropVertical = document.getElementById("cropVertical");
        const centerWidth = !Number.isNaN(overlayWidth) && overlayWidth > 0 ? overlayWidth : 60;
        const centerHeight = 580;
        const cropLeft = Math.max(0, Math.round((canvasWidth - centerWidth) / 2));
        const cropTop = Math.max(0, Math.round((canvasHeight - centerHeight) / 2));
        if (cropHorizontal) {
            cropHorizontal.textContent = `Left: ${cropLeft} Right: ${cropLeft}`;
        }
        if (cropVertical) {
            cropVertical.textContent = `Top: ${cropTop} Bottom: ${cropTop}`;
        }

        if (downloadBtn) {
            downloadBtn.disabled = false;
        }
    }

    function drawStyledNumber(ctx, numberValue, style, options) {
        const digits = String(Math.abs(numberValue)).split("");
        const { centerX, centerY, baseSize, pixelHeight, pixelWidth, setFont } = options;
        const lineHeight = baseSize;

        if (style === "stacked") {
            setFont(baseSize);
            const totalHeight = lineHeight * digits.length;
            let startY = centerY - totalHeight / 2 + lineHeight / 2;
            digits.forEach((digit) => {
                ctx.fillText(digit, centerX, startY);
                startY += lineHeight;
            });
            return;
        }

        if (style === "slackow") {
            const lastDigit = numberValue % 10;
            if (lastDigit !== 0) {
                setFont(baseSize);
                ctx.fillText(String(lastDigit), centerX, centerY);
                return;
            }
            const prefix = digits.slice(0, -1).join("") || "0";
            const lines = [prefix, "0"];
            setFont(baseSize);
            const totalHeight = lineHeight * lines.length;
            let startY = centerY - totalHeight / 2 + lineHeight / 2;
            lines.forEach((line) => {
                ctx.fillText(line, centerX, startY);
                startY += lineHeight;
            });
            return;
        }

        if (style === "compact") {
            const mainDigit = digits[digits.length - 1];
            const prefixDigits = digits.slice(0, -1).join("");
            const smallSize = Math.max(1, Math.round(baseSize * 0.6));

            setFont(baseSize);
            ctx.fillText(mainDigit, centerX, centerY);

            if (prefixDigits.length > 0) {
                setFont(smallSize);
                ctx.fillText(prefixDigits, centerX, centerY - baseSize * 0.7);
            }
            return;
        }

        // Normal style
        const maxWidth = pixelWidth * 0.8;
        const fittedSize = fitFontToWidth(ctx, digits.join(""), maxWidth, baseSize, setFont);
        const adjustedSize = Math.min(fittedSize, pixelHeight * 0.9);
        setFont(adjustedSize);
        ctx.fillText(digits.join(""), centerX, centerY);
    }

    function downloadImage() {
        const canvas = document.getElementById("canvas");
        if (!canvas) {
            return;
        }
        const link = document.createElement("a");
        link.href = canvas.toDataURL();
        link.download = "overlay.png";
        link.click();
    }

    window.downloadImage = downloadImage;
})();
