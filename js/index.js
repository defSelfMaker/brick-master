function incrementTransaction(count) {
    return (count || 0) + 1;
}

const LOW_DPI = 48;
const HIGH_DPI = 96;

const interactionSelectors = [
    "input-image-selector",
    "input-image-selector-hidden",
    "mix-in-stud-map-button",
    "width-slider",
    "height-slider",
    "hue-slider",
    "saturation-slider",
    "value-slider",
    "reset-hsv-button",
    "reset-brightness-button",
    "reset-contrast-button",
    "add-custom-stud-button",
    "export-to-bricklink-button",
    "import-stud-map-file-input",
    "bricklink-piece-button",
    "clear-overrides-button",
    "clear-custom-studs-button",
    "infinite-piece-count-check",
    "color-ties-resolution-button",
    "resolution-limit-increase-button",
    "high-quality-instructions-check",
    "num-depth-levels-slider",
    "high-quality-depth-instructions-check",
].map((id) => document.getElementById(id));

const customStudTableBody = document.getElementById("custom-stud-table-body");

function disableInteraction() {
    [...document.getElementsByTagName("input")].forEach(
        (button) => (button.disabled = true),
    );
    [...document.getElementsByClassName("btn")].forEach(
        (button) => (button.disabled = true),
    );
    [...document.getElementsByClassName("nav-link")].forEach(
        (link) => (link.className = link.className + " disabled"),
    );
    document.getElementById("universal-loading-progress").hidden = false;
    document.getElementById("universal-loading-progress-complement").hidden =
        true;
    if (inputImageCropper != null) {
        inputImageCropper.disable();
    }
}

function enableInteraction() {
    [...document.getElementsByTagName("input")].forEach((button) => {
        button.disabled = button.className.includes("always-disabled");
    });
    [...document.getElementsByClassName("btn")].forEach(
        (button) => (button.disabled = false),
    );
    [...document.getElementsByClassName("nav-link")].forEach(
        (link) => (link.className = link.className.replace(/ disabled/g, "")),
    );
    document.getElementById("universal-loading-progress").hidden = true;
    document.getElementById("universal-loading-progress-complement").hidden =
        false;
    if (inputImageCropper != null) {
        inputImageCropper.enable();
    }
}

const CNN_INPUT_IMAGE_WIDTH = 256;
const CNN_INPUT_IMAGE_HEIGHT = 256;

let inputImage = null;

const inputCanvas = document.getElementById("input-canvas");
const inputCanvasContext = inputCanvas.getContext("2d");
const inputDepthCanvas = document.getElementById("input-depth-canvas");
const inputDepthCanvasContext = inputDepthCanvas.getContext("2d");

const webWorkerInputCanvas = document.getElementById("web-worker-input-canvas");
const webWorkerInputCanvasContext = webWorkerInputCanvas.getContext("2d");
const webWorkerOutputCanvas = document.getElementById(
    "web-worker-output-canvas",
);
const webWorkerOutputCanvasContext = webWorkerOutputCanvas.getContext("2d");

const step1CanvasUpscaled = document.getElementById("step-1-canvas-upscaled");
const step1CanvasUpscaledContext = step1CanvasUpscaled.getContext("2d");
const step1DepthCanvasUpscaled = document.getElementById(
    "step-1-depth-canvas-upscaled",
);
const step1DepthCanvasUpscaledContext =
    step1DepthCanvasUpscaled.getContext("2d");

const step2Canvas = document.getElementById("step-2-canvas");
const step2CanvasContext = step2Canvas.getContext("2d");
const step2CanvasUpscaled = document.getElementById("step-2-canvas-upscaled");
const step2CanvasUpscaledContext = step2CanvasUpscaled.getContext("2d");
const step2DepthCanvas = document.getElementById("step-2-depth-canvas");
const step2DepthCanvasContext = step2DepthCanvas.getContext("2d");
const step2DepthCanvasUpscaled = document.getElementById(
    "step-2-depth-canvas-upscaled",
);
const step2DepthCanvasUpscaledContext =
    step2DepthCanvasUpscaled.getContext("2d");

const step3Canvas = document.getElementById("step-3-canvas");
const step3CanvasContext = step3Canvas.getContext("2d");
const step3CanvasUpscaled = document.getElementById("step-3-canvas-upscaled");
const step3CanvasUpscaledContext = step3CanvasUpscaled.getContext("2d");
const step3DepthCanvas = document.getElementById("step-3-depth-canvas");
const step3DepthCanvasContext = step3DepthCanvas.getContext("2d");
const step3DepthCanvasUpscaled = document.getElementById(
    "step-3-depth-canvas-upscaled",
);
const step3DepthCanvasUpscaledContext =
    step3DepthCanvasUpscaled.getContext("2d");

const step4Canvas = document.getElementById("step-4-canvas");
const step4CanvasContext = step4Canvas.getContext("2d");
const step4CanvasUpscaled = document.getElementById("step-4-canvas-upscaled");
const step4CanvasUpscaledContext = step4CanvasUpscaled.getContext("2d");
const step4Canvas3dUpscaled = document.getElementById(
    "step-4-canvas-3d-upscaled",
);

const bricklinkCacheCanvas = document.getElementById("bricklink-cache-canvas");

let targetResolution = [
    Number(document.getElementById("width-slider").value),
    Number(document.getElementById("height-slider").value),
];
const PIXEL_WIDTH_CM = 0.8;
const INCHES_IN_CM = 0.393701;
const SCALING_FACTOR = 40;
const PLATE_WIDTH = 16;

document.getElementById("width-text").title =
    `${(targetResolution[0] * PIXEL_WIDTH_CM).toFixed(1)} cm, ${(
        targetResolution[0] *
        PIXEL_WIDTH_CM *
        INCHES_IN_CM
    ).toFixed(1)}″`;
document.getElementById("height-text").title =
    `${(targetResolution[1] * PIXEL_WIDTH_CM).toFixed(1)} cm, ${(
        targetResolution[1] *
        PIXEL_WIDTH_CM *
        INCHES_IN_CM
    ).toFixed(1)}″`;

let inputImageCropper;

function initializeCropper() {
    if (inputImageCropper != null) {
        inputImageCropper.destroy();
    }
    inputImageCropper = new Cropper(step1CanvasUpscaled, {
        aspectRatio: targetResolution[0] / targetResolution[1],
        viewMode: 3,
        minContainerWidth: 1,
        minContainerHeight: 1,
        cropend() {
            overridePixelArray = new Array(
                targetResolution[0] * targetResolution[1] * 4,
            ).fill(null);
            overrideDepthPixelArray = new Array(
                targetResolution[0] * targetResolution[1] * 4,
            ).fill(null);
        },
    });
}

step1CanvasUpscaled.addEventListener("cropend", runStep1);

window.addEventListener("resize", () => {
    [step4Canvas].forEach((canvas) => {
        canvas.height =
            (window.getComputedStyle(canvas).width * targetResolution[1]) /
            targetResolution[0];
    });
});

let depthEnabled = false;

Object.keys(PLATE_DIMENSIONS_TO_PART_ID).forEach((plate) => {
    ["depth-plates-container", "pixel-dimensions-container"].forEach(
        (container) => {
            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = plate;
            input.checked = !DEFAULT_DISABLED_DEPTH_PLATES.includes(plate);
            input.disabled = plate === "1 X 1";
            input.className =
                plate === "1 X 1" ? "always-disabled" : "checkbox-clickable";
            const label = document.createElement("label");
            label.className = plate === "1 X 1" ? "" : "checkbox-clickable";
            const plateSpan = document.createElement("span");
            plateSpan.innerHTML = " " + plate;
            label.appendChild(input);
            label.appendChild(plateSpan);
            const checkbox = document.createElement("div");
            checkbox.style = "margin-top: 2px; margin-left: 4px";
            checkbox.appendChild(label);
            if (container === "pixel-dimensions-container") {
                checkbox.addEventListener("change", () => {
                    disableInteraction();
                    runStep3();
                });
                const classes = [];
                if (PLATE_DIMENSIONS_TO_PART_ID[plate]) {
                    // for now, this is always true
                    classes.push("variable-plate-checkbox");
                }
                if (TILE_DIMENSIONS_TO_PART_ID[plate]) {
                    classes.push("variable-tile-checkbox");
                }
                if (BRICK_DIMENSIONS_TO_PART_ID[plate]) {
                    classes.push("variable-brick-checkbox");
                }
                checkbox.className = classes.join(" ");
                input.className = [input.className, ...classes].join(" ");
            }
        },
    );
});

const quantizationAlgorithmsInfo = {
    twoPhase: {
        name: "2 Phase",
    },
    floydSteinberg: {
        name: "Floyd-Steinberg Dithering",
    },
    jarvisJudiceNinkeDithering: {
        name: "Jarvis-Judice-Ninke Dithering",
    },
    atkinsonDithering: {
        name: "Atkinson Dithering",
    },
    sierraDithering: {
        name: "Sierra Dithering",
    },
    greedy: {
        name: "Greedy",
    },
    greedyWithDithering: {
        name: "Greedy Gaussian Dithering",
    },
};

const quantizationAlgorithmToTraditionalDitheringKernel = {
    floydSteinberg: FLOYD_STEINBERG_DITHERING_KERNEL,
    jarvisJudiceNinkeDithering: JARVIS_JUDICE_NINKE_DITHERING_KERNEL,
    atkinsonDithering: ATKINSON_DITHERING_KERNEL,
    sierraDithering: SIERRA_DITHERING_KERNEL,
};

const defaultQuantizationAlgorithmKey = "twoPhase";
let quantizationAlgorithm = defaultQuantizationAlgorithmKey;

let selectedPixelPartNumber = PIXEL_TYPE_OPTIONS[0].number;

// TODO: Make this a function
let overridePixelArray = new Array(
    targetResolution[0] * targetResolution[1] * 4,
).fill(null);
let overrideDepthPixelArray = new Array(
    targetResolution[0] * targetResolution[1] * 4,
).fill(null);

function handleResolutionChange() {
    overridePixelArray = new Array(
        targetResolution[0] * targetResolution[1] * 4,
    ).fill(null);
    overrideDepthPixelArray = new Array(
        targetResolution[0] * targetResolution[1] * 4,
    ).fill(null);
    document.getElementById("width-text").title =
        `${(targetResolution[0] * PIXEL_WIDTH_CM).toFixed(1)} cm, ${(
            targetResolution[0] *
            PIXEL_WIDTH_CM *
            INCHES_IN_CM
        ).toFixed(1)}″`;
    document.getElementById("height-text").title =
        `${(targetResolution[1] * PIXEL_WIDTH_CM).toFixed(1)} cm, ${(
            targetResolution[1] *
            PIXEL_WIDTH_CM *
            INCHES_IN_CM
        ).toFixed(1)}″`;
    $('[data-toggle="tooltip"]').tooltip("dispose");
    $('[data-toggle="tooltip"]').tooltip();
    initializeCropper();
    runStep1();
}

document.getElementById("width-slider").addEventListener(
    "change",
    () => {
        document.getElementById("width-text").innerHTML =
            document.getElementById("width-slider").value;
        targetResolution[0] = document.getElementById("width-slider").value;
        handleResolutionChange();
    },
    false,
);

document.getElementById("height-slider").addEventListener(
    "change",
    () => {
        document.getElementById("height-text").innerHTML =
            document.getElementById("height-slider").value;
        targetResolution[1] = document.getElementById("height-slider").value;
        handleResolutionChange();
    },
    false,
);
document
    .getElementById("clear-overrides-button")
    .addEventListener("click", () => {
        overridePixelArray = new Array(
            targetResolution[0] * targetResolution[1] * 4,
        ).fill(null);
        runStep2();
    });
document
    .getElementById("clear-depth-overrides-button")
    .addEventListener("click", () => {
        overrideDepthPixelArray = new Array(
            targetResolution[0] * targetResolution[1] * 4,
        ).fill(null);
        runStep2();
    });

let DEFAULT_STUD_MAP = "all_tile_colors";
let DEFAULT_COLOR = "#853433";
let DEFAULT_COLOR_NAME = "154";

let selectedStudMap = STUD_MAPS[DEFAULT_STUD_MAP].studMap;
let selectedFullSetName = STUD_MAPS[DEFAULT_STUD_MAP].officialName;
let selectedSortedStuds = STUD_MAPS[DEFAULT_STUD_MAP].sortedStuds;

function populateCustomStudSelectors(studMap, shouldRunAfterPopulation) {
    studMap.sortedStuds.forEach((stud) => {
        const studRow = getNewCustomStudRow();
        studRow.children[0].children[0].children[0].children[0].style.backgroundColor =
            stud;
        studRow.children[0].children[0].setAttribute(
            "title",
            HEX_TO_COLOR_NAME[stud] || stud,
        );
        studRow.children[1].children[0].children[0].value =
            studMap.studMap[stud];
    });
    if (shouldRunAfterPopulation) {
        runCustomStudMap();
    }
}

function mixInStudMap(studMap, runAfterMixIn) {
    studMap.sortedStuds.forEach((stud) => {
        let existingRow = null;
        Array.from(customStudTableBody.children).forEach((row) => {
            const rgb =
                row.children[0].children[0].children[0].children[0].style.backgroundColor
                    .replace("rgb(", "")
                    .replace(")", "")
                    .split(/,\s*/)
                    .map((shade) => parseInt(shade));
            const rowHex = rgbToHex(rgb[0], rgb[1], rgb[2]);
            if (rowHex == stud && existingRow == null) {
                existingRow = row;
            }
        });

        if (existingRow == null) {
            const newStudRow = getNewCustomStudRow();
            newStudRow.children[0].children[0].children[0].innerHTML = "";
            newStudRow.children[0].children[0].children[0].appendChild(
                getColorSquare(stud),
            );
            newStudRow.children[0].children[0].setAttribute(
                "title",
                HEX_TO_COLOR_NAME[stud] || stud,
            );
            newStudRow.children[1].children[0].children[0].value =
                studMap.studMap[stud];
            customStudTableBody.appendChild(newStudRow);
        } else {
            existingRow.children[1].children[0].children[0].value = Math.min(
                parseInt(
                    existingRow.children[1].children[0].children[0].value,
                ) + studMap.studMap[stud],
                99999,
            );
        }
    });
    // TODO: Clean up boolean logic here
    runCustomStudMap(!runAfterMixIn);
}

populateCustomStudSelectors(STUD_MAPS[DEFAULT_STUD_MAP], false);

const mixInStudMapOptions = document.getElementById("mix-in-stud-map-options");

const bricklinkPieceOptions = document.getElementById(
    "bricklink-piece-options",
);

function isBleedthroughEnabled() {
    return [PIXEL_TYPE_OPTIONS[0].number].includes(selectedPixelPartNumber);
}

let selectedTiebreakTechnique = "alternatingmod";

let selectedInterpolationAlgorithm = "default";

// Color distance stuff
function d3ColorDistanceWrapper(d3DistanceFunction) {
    return (c1, c2) =>
        d3DistanceFunction(
            d3.color(rgbToHex(c1[0], c1[1], c1[2])),
            d3.color(rgbToHex(c2[0], c2[1], c2[2])),
        );
}

function RGBPixelDistanceSquared(pixel1, pixel2) {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
        sum += Math.abs(pixel1[i] - pixel2[i]);
    }
    return sum;
}

const colorDistanceFunctionsInfo = {
    euclideanRGB: {
        name: "Euclidean RGB",
        func: RGBPixelDistanceSquared,
    },
    euclideanLAB: {
        name: "Euclidean LAB",
        func: d3ColorDistanceWrapper(d3.differenceEuclideanLab),
    },
    cie94: {
        name: "CIE94",
        func: d3ColorDistanceWrapper(d3.differenceCie94),
    },
    ciede2000: {
        name: "CIEDE2000",
        func: d3ColorDistanceWrapper(d3.differenceCiede2000),
    },
    din99o: {
        name: "DIN99o",
        func: d3ColorDistanceWrapper(d3.differenceDin99o),
    },
};

const defaultDistanceFunctionKey = "ciede2000";
let colorDistanceFunction =
    colorDistanceFunctionsInfo[defaultDistanceFunctionKey].func;

function onInfinitePieceCountChange() {
    const infiniteCheckbox = document.getElementById(
        "infinite-piece-count-check",
    );
    const isUsingInfinite =
        (infiniteCheckbox ? infiniteCheckbox.checked : false) ||
        Object.keys(quantizationAlgorithmToTraditionalDitheringKernel).includes(
            quantizationAlgorithm,
        ) ||
        ("" + selectedPixelPartNumber).match("^variable.*$");
    [...document.getElementsByClassName("piece-count-input")].forEach(
        (numberInput) => (numberInput.hidden = isUsingInfinite),
    );
    [
        ...document.getElementsByClassName("piece-count-infinity-placeholder"),
    ].forEach((placeholder) => (placeholder.hidden = !isUsingInfinite));
}

function updateForceInfinitePieceCountText() {
    const isInfinitePieceCountForced =
        Object.keys(quantizationAlgorithmToTraditionalDitheringKernel).includes(
            quantizationAlgorithm,
        ) || ("" + selectedPixelPartNumber).match("^variable.*$");
    const container = document.getElementById(
        "infinite-piece-count-check-container",
    );
    if (container) container.hidden = isInfinitePieceCountForced;

    const warning = document.getElementById(
        "forced-infinite-piece-count-warning",
    );
    if (warning) warning.hidden = !isInfinitePieceCountForced;
}

const DIVIDER = "DIVIDER";
const STUD_MAP_KEYS = Object.keys(STUD_MAPS);
const NUM_SET_STUD_MAPS = 12;
const NUM_PARTIAL_SET_STUD_MAPS = 7;
STUD_MAP_KEYS.splice(NUM_SET_STUD_MAPS, 0, DIVIDER);
STUD_MAP_KEYS.splice(
    NUM_SET_STUD_MAPS + NUM_PARTIAL_SET_STUD_MAPS + 1,
    0,
    DIVIDER,
);

STUD_MAP_KEYS.filter((key) => key !== "rgb").forEach((studMap) => {
    if (studMap === DIVIDER) {
        const divider = document.createElement("div");
        divider.className = "dropdown-divider";
    } else {
        const option = document.createElement("a");
        option.className = "dropdown-item btn";
        option.textContent = STUD_MAPS[studMap].name;
        option.value = studMap;
        option.addEventListener("click", () => {
            mixInStudMap(STUD_MAPS[studMap], true);
        });
    }
});

constMixInDivider = document.createElement("div");
constMixInDivider.className = "dropdown-divider";

const importOption = document.createElement("a");
importOption.className = "dropdown-item btn";
importOption.textContent = "Import From File";
importOption.value = null;
importOption.addEventListener("click", () => {
    document.getElementById("import-stud-map-file-input").click();
});

function runCustomStudMap(skipStep1) {
    if (!customStudTableBody) {
        return;
    }
    const customStudMap = {};
    const customSortedStuds = [];
    Array.from(customStudTableBody.children).forEach((stud) => {
        const rgb =
            stud.children[0].children[0].children[0].children[0].style.backgroundColor
                .replace("rgb(", "")
                .replace(")", "")
                .split(/,\s*/)
                .map((shade) => parseInt(shade));
        const studHex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        customSortedStuds.push(studHex);
        const numStuds = parseInt(
            stud.children[1].children[0].children[0].value,
        );
        customStudMap[studHex] = (customStudMap[studHex] || 0) + numStuds;
    });
    if (customSortedStuds.length > 0) {
        selectedStudMap = customStudMap;
        selectedFullSetName = "Custom";
        selectedSortedStuds = customSortedStuds;
    }
    if (!skipStep1) {
        runStep1();
    }
}

function getColorSquare(hex) {
    const result = document.createElement("div");
    result.style.backgroundColor = hex;
    result.style.width = "1em";
    result.style.height = "1em";
    return result;
}

function getColorSelectorDropdown(tooltipPosition) {
    if (!tooltipPosition) {
        tooltipPosition = "left";
    }
    const container = document.createElement("div");
    const id = "color-selector" + uuidv4();

    const button = document.createElement("button");
    button.className = "btn btn-outline-secondary";
    button.type = "button";
    button.setAttribute("data-toggle", "dropdown");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");
    button.id = id;
    button.appendChild(getColorSquare(DEFAULT_COLOR));
    button.value = DEFAULT_COLOR;

    const dropdown = document.createElement("div");
    dropdown.setAttribute("aria-labelledby", id);
    dropdown.className = "dropdown-menu pre-scrollable";

    ALL_VALID_BRICKLINK_COLORS.forEach((color) => {
        const option = document.createElement("a");
        option.style.display = "flex";
        option.className = "dropdown-item btn";
        const text = document.createElement("span");
        text.innerHTML = "&nbsp;" + color.name;
        const colorSquare = getColorSquare(color.hex);
        colorSquare.style.marginTop = "3px";
        option.appendChild(colorSquare);
        option.appendChild(text);
        option.addEventListener("click", () => {
            button.innerHTML = "";
            button.appendChild(getColorSquare(color.hex));
            container.setAttribute("title", color.name);
            $('[data-toggle="tooltip"]').tooltip("dispose");
            $('[data-toggle="tooltip"]').tooltip();
            runCustomStudMap();
        });
        dropdown.appendChild(option);
    });

    container.setAttribute("data-toggle", "tooltip");
    container.setAttribute("data-placement", tooltipPosition);
    container.setAttribute("title", DEFAULT_COLOR_NAME);
    setTimeout(() => $('[data-toggle="tooltip"]').tooltip(), 10);
    container.appendChild(button);
    container.appendChild(dropdown);
    return container;
}

const paintbrushDropdown = getColorSelectorDropdown("top");
paintbrushDropdown.children[0].id = "paintbrush-color-dropdown";
paintbrushDropdown.children[0].className = "btn paintbrush-controls-button";
paintbrushDropdown.style = "height: 100%;";
document.getElementById("paintbrush-controls").appendChild(paintbrushDropdown);

function getNewCustomStudRow() {
    const studRow = document.createElement("tr");

    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-danger";
    removeButton.style = "padding: 2px; margin-left: 4px;";
    removeButton.innerHTML = "X";
    removeButton.addEventListener("click", () => {
        customStudTableBody.removeChild(studRow);
        runCustomStudMap();
    });

    const colorCell = document.createElement("td");
    const colorInput = getColorSelectorDropdown();
    colorCell.appendChild(colorInput);
    studRow.appendChild(colorCell);

    const numberCell = document.createElement("td");
    const numberCellChild = document.createElement("div");
    const numberInput = document.createElement("input");
    numberInput.style = "max-width: 80px";
    numberInput.type = "number";
    numberInput.value = 10;
    numberInput.className = "form-control form-control-sm piece-count-input";
    numberInput.addEventListener("change", (v) => {
        numberInput.value = Math.round(
            Math.min(Math.max(parseFloat(numberInput.value) || 0, 0), 99999),
        );
        runCustomStudMap();
    });

    infinityPlaceholder = document.createElement("div");
    infinityPlaceholder.hidden = !numberInput.hidden;
    infinityPlaceholder.className = "piece-count-infinity-placeholder";
    infinityPlaceholder.innerHTML = "∞";
    numberCellChild.style = "display: flex; flex-direction: horizontal;";
    numberCellChild.appendChild(numberInput);
    numberCellChild.appendChild(infinityPlaceholder);

    numberCellChild.appendChild(removeButton);
    numberCell.appendChild(numberCellChild);
    studRow.appendChild(numberCell);
    return studRow;
}

const onHueChange = () => {
    document.getElementById("hue-text").innerHTML =
        document.getElementById("hue-slider").value + "<span>&#176;</span>";
    runStep2();
};

const onSaturationChange = () => {
    document.getElementById("saturation-text").innerHTML =
        document.getElementById("saturation-slider").value + "%";
    runStep2();
};

const onValueChange = () => {
    document.getElementById("value-text").innerHTML =
        document.getElementById("value-slider").value + "%";
    runStep2();
};

function onDepthMapCountChange() {
    const numLevels = Number(
        document.getElementById("num-depth-levels-slider").value,
    );
    overrideDepthPixelArray = new Array(
        targetResolution[0] * targetResolution[1] * 4,
    ).fill(null);
    document.getElementById("num-depth-levels-text").innerHTML = numLevels;
    const inputs = [];
    const inputsContainer = document.getElementById(
        "depth-threshold-sliders-containers",
    );
    inputsContainer.innerHTML = "";
    for (let i = 0; i < numLevels - 1; i++) {
        const input = document.createElement("input");
        input.type = "range";
        input.min = 0;
        input.max = 255;
        input.value = Math.floor(255 * ((i + 1) / numLevels));
        input.style = "width: 100%";
        input.addEventListener("change", () => {
            for (let j = 0; j < i; j++) {
                inputs[j].value = Math.min(inputs[j].value, input.value);
            }
            for (let j = i + 1; j < numLevels - 1; j++) {
                inputs[j].value = Math.max(inputs[j].value, input.value);
            }
            runStep1();
        });
        inputs.push(input);
        inputsContainer.appendChild(input);
    }

    [...document.getElementsByClassName("threshold-plural-s")].forEach(
        (s) => (s.hidden = numLevels < 3),
    );

    runStep1();
}

document
    .getElementById("num-depth-levels-slider")
    .addEventListener("change", onDepthMapCountChange, false);

function runStep1() {
    disableInteraction();

    step1DepthCanvasUpscaled.width = step1CanvasUpscaled.width;
    step1DepthCanvasUpscaled.height = step1CanvasUpscaled.height;
    step1DepthCanvasUpscaledContext.drawImage(
        inputDepthCanvas,
        0,
        0,
        step1CanvasUpscaled.width,
        step1CanvasUpscaled.height,
    );
    setTimeout(() => {
        runStep2();
    }, 1); // TODO: find better way to check that input is finished
}

function runStep2() {
    let inputPixelArray;
    if (selectedInterpolationAlgorithm === "default") {
        const croppedCanvas = inputImageCropper.getCroppedCanvas({
            width: targetResolution[0],
            height: targetResolution[1],
            maxWidth: 4096,
            maxHeight: 4096,
            imageSmoothingEnabled: false,
        });
        inputPixelArray = getPixelArrayFromCanvas(croppedCanvas);
    } else {
        // We're using adaptive pooling
        const croppedCanvas = inputImageCropper.getCroppedCanvas({
            maxWidth: 4096,
            maxHeight: 4096,
            imageSmoothingEnabled: false,
        });
        rawCroppedData = getPixelArrayFromCanvas(croppedCanvas);
        let subArrayPoolingFunction;
        if (selectedInterpolationAlgorithm === "maxPooling") {
            subArrayPoolingFunction = maxPoolingKernel;
        } else if (selectedInterpolationAlgorithm === "minPooling") {
            subArrayPoolingFunction = minPoolingKernel;
        } else if (selectedInterpolationAlgorithm === "avgPooling") {
            subArrayPoolingFunction = avgPoolingKernel;
        } else {
            subArrayPoolingFunction = dualMinMaxPoolingKernel;
        }
        inputPixelArray = resizeImagePixelsWithAdaptivePooling(
            rawCroppedData,
            croppedCanvas.width,
            targetResolution[0],
            targetResolution[1],
            subArrayPoolingFunction,
        );
    }

    step2Canvas.width = targetResolution[0];
    step2Canvas.height = targetResolution[1];
    drawPixelsOnCanvas(inputPixelArray, step2Canvas);

    step2DepthCanvas.width = targetResolution[0];
    step2DepthCanvas.height = targetResolution[1];

    // Map the crop to the depth image
    const cropperData = inputImageCropper.getData();
    const rawCroppedDepthImage = step1DepthCanvasUpscaledContext.getImageData(
        cropperData.x,
        cropperData.y,
        cropperData.width,
        cropperData.height,
    );
    const cropperBufferCanvas = document.getElementById(
        "step-2-depth-canvas-cropper-buffer",
    );
    const cropperBufferCanvasContext = cropperBufferCanvas.getContext("2d");
    cropperBufferCanvas.width = targetResolution[0];
    cropperBufferCanvas.height = targetResolution[1];
    cropperBufferCanvasContext.drawImage(
        step1DepthCanvasUpscaled,
        cropperData.x,
        cropperData.y,
        cropperData.width,
        cropperData.height,
        0,
        0,
        targetResolution[0],
        targetResolution[1],
    );
    const inputDepthPixelArray = getPixelArrayFromCanvas(cropperBufferCanvas);

    const discreteDepthPixels = getDiscreteDepthPixels(
        inputDepthPixelArray,
        [
            ...document.getElementById("depth-threshold-sliders-containers")
                .children,
        ].map((slider) => Number(slider.value)),
    );
    drawPixelsOnCanvas(discreteDepthPixels, step2DepthCanvas);

    setTimeout(() => {
        runStep3();
        step2CanvasUpscaled.width = targetResolution[0] * SCALING_FACTOR;
        step2CanvasUpscaled.height = targetResolution[1] * SCALING_FACTOR;
        step2CanvasUpscaledContext.imageSmoothingEnabled = false;
        step2CanvasUpscaledContext.drawImage(
            step2Canvas,
            0,
            0,
            targetResolution[0] * SCALING_FACTOR,
            targetResolution[1] * SCALING_FACTOR,
        );
        step2DepthCanvasUpscaled.width = targetResolution[0] * SCALING_FACTOR;
        step2DepthCanvasUpscaled.height = targetResolution[1] * SCALING_FACTOR;
        drawStudImageOnCanvas(
            scaleUpDiscreteDepthPixelsForDisplay(
                discreteDepthPixels,
                document.getElementById("num-depth-levels-slider").value,
            ),
            targetResolution[0],
            SCALING_FACTOR,
            step2DepthCanvasUpscaled,
            selectedPixelPartNumber,
        );
    }, 1); // TODO: find better way to check that input is finished
}

function getVariablePixelAvailablePartDimensions() {
    const availableParts = [
        ...document.getElementById("pixel-dimensions-container").children,
    ]
        .map((div) => div.children[0])
        .map((label) => label.children[0])
        .filter((input) => input.checked)
        .filter((input) => {
            const className = input.className;
            const uniqueVariablePixelName = selectedPixelPartNumber.replace(
                "variable_",
                "",
            );
            return className.includes(uniqueVariablePixelName);
        })
        .map((input) => input.name)
        .map((part) =>
            part
                .split(PLATE_DIMENSIONS_DEPTH_SEPERATOR)
                .map((dimension) => Number(dimension)),
        );
    const flippedParts = [];
    availableParts.forEach((part) => {
        if (part[0] !== part[1]) {
            flippedParts.push([part[1], part[0]]);
        }
    });
    flippedParts.forEach((part) => availableParts.push(part));
    return availableParts;
}

// only non null if pixel piece is variable
let step3VariablePixelPieceDimensions = null;

function runStep3() {
    const fiteredPixelArray = getPixelArrayFromCanvas(step2Canvas);

    let alignedPixelArray;

    // TODO: Apply overrides separately
    if (quantizationAlgorithm === "twoPhase") {
        alignedPixelArray = alignPixelsToStudMap(
            fiteredPixelArray,
            isBleedthroughEnabled()
                ? getDarkenedStudMap(selectedStudMap)
                : selectedStudMap,
            colorDistanceFunction,
        );
    } else if (
        quantizationAlgorithm === "greedy" ||
        quantizationAlgorithm === "greedyWithDithering"
    ) {
        alignedPixelArray =
            correctPixelsForAvailableStudsWithGreedyDynamicDithering(
                isBleedthroughEnabled()
                    ? getDarkenedStudMap(selectedStudMap)
                    : selectedStudMap,
                fiteredPixelArray,
                targetResolution[0],
                colorDistanceFunction,
                quantizationAlgorithm !== "greedyWithDithering", // skipDithering
                true, // assumeInfinitePixelCounts
            );
    } else {
        // assume we're dealing with a traditional error dithering algorithm
        const ditheringKernel =
            quantizationAlgorithmToTraditionalDitheringKernel[
                quantizationAlgorithm
            ];
        alignedPixelArray = alignPixelsWithTraditionalDithering(
            isBleedthroughEnabled()
                ? getDarkenedStudMap(selectedStudMap)
                : selectedStudMap,
            fiteredPixelArray,
            targetResolution[0],
            colorDistanceFunction,
            ditheringKernel,
        );
    }

    step3PixelArrayForEraser = alignedPixelArray;
    alignedPixelArray = getArrayWithOverridesApplied(
        alignedPixelArray,
        isBleedthroughEnabled()
            ? getDarkenedImage(overridePixelArray)
            : overridePixelArray,
    );

    step3DepthCanvas.width = targetResolution[0];
    step3DepthCanvas.height = targetResolution[1];
    const inputDepthPixelArray = getPixelArrayFromCanvas(step2DepthCanvas);

    const adjustedDepthPixelArray = getArrayWithOverridesApplied(
        inputDepthPixelArray,
        overrideDepthPixelArray,
    );

    drawPixelsOnCanvas(adjustedDepthPixelArray, step3DepthCanvas);

    if (("" + selectedPixelPartNumber).match("^variable.*$")) {
        const alignedPixelMatrix = convertPixelArrayToMatrix(
            alignedPixelArray,
            targetResolution[0],
        );
        step3VariablePixelPieceDimensions = new Array();
        for (let i = 0; i < targetResolution[1]; i++) {
            step3VariablePixelPieceDimensions.push([]);
            step3VariablePixelPieceDimensions[i] = [];
            for (let j = 0; j < targetResolution[0]; j++) {
                step3VariablePixelPieceDimensions[i].push(null);
            }
        }
        const uniqueColors = Object.keys(
            getUsedPixelsStudMap(alignedPixelArray),
        );
        const availableParts = getVariablePixelAvailablePartDimensions();
        for (
            let depthLevel = 0;
            depthLevel <
            Number(document.getElementById("num-depth-levels-slider").value);
            depthLevel++
        ) {
            uniqueColors.forEach((colorHex) => {
                const colorRGB = hexToRgb(colorHex);
                const setPixelMatrix = getSetPixelMatrixFromInputMatrix(
                    alignedPixelMatrix,
                    (p, i, j) => {
                        return !(
                            (!depthEnabled ||
                                depthLevel ===
                                    adjustedDepthPixelArray[
                                        4 * (i * targetResolution[0] + j)
                                    ]) &&
                            p[0] === colorRGB[0] &&
                            p[1] === colorRGB[1] &&
                            p[2] === colorRGB[2]
                        );
                    },
                );
                const requiredPartMatrix =
                    getRequiredPartMatrixFromSetPixelMatrix(
                        setPixelMatrix,
                        availableParts,
                        PLATE_WIDTH,
                    );
                requiredPartMatrix.forEach((row, i) => {
                    row.forEach((entry, j) => {
                        step3VariablePixelPieceDimensions[i][j] =
                            step3VariablePixelPieceDimensions[i][j] || entry;
                    });
                });
            });
        }
    } else {
        step3VariablePixelPieceDimensions = null;
    }

    step3Canvas.width = targetResolution[0];
    step3Canvas.height = targetResolution[1];
    drawPixelsOnCanvas(alignedPixelArray, step3Canvas);

    step3CanvasPixelsForHover = isBleedthroughEnabled()
        ? revertDarkenedImage(
              alignedPixelArray,
              getDarkenedStudsToStuds(
                  ALL_BRICKLINK_SOLID_COLORS.map((color) => color.hex),
              ),
          )
        : alignedPixelArray;
    step3DepthCanvasPixelsForHover = adjustedDepthPixelArray;

    const step3QuantizationError = getAverageQuantizationError(
        fiteredPixelArray,
        alignedPixelArray,
        colorDistanceFunction,
    );
    document.getElementById("step-3-quantization-error").innerHTML =
        step3QuantizationError.toFixed(3);

    setTimeout(() => {
        if (!isStep3ViewExpanded) {
            runStep4();
        } else {
            enableInteraction();
        }
        step3CanvasUpscaledContext.imageSmoothingEnabled = false;
        drawStudImageOnCanvas(
            isBleedthroughEnabled()
                ? revertDarkenedImage(
                      alignedPixelArray,
                      getDarkenedStudsToStuds(
                          ALL_BRICKLINK_SOLID_COLORS.map((color) => color.hex),
                      ),
                  )
                : alignedPixelArray,
            targetResolution[0],
            SCALING_FACTOR,
            step3CanvasUpscaled,
            selectedPixelPartNumber,
            step3VariablePixelPieceDimensions,
        );
        step3DepthCanvasUpscaled.width = targetResolution[0] * SCALING_FACTOR;
        step3DepthCanvasUpscaled.height = targetResolution[1] * SCALING_FACTOR;
        drawStudImageOnCanvas(
            scaleUpDiscreteDepthPixelsForDisplay(
                adjustedDepthPixelArray,
                document.getElementById("num-depth-levels-slider").value,
            ),
            targetResolution[0],
            SCALING_FACTOR,
            step3DepthCanvasUpscaled,
            selectedPixelPartNumber,
        );
    }, 1); // TODO: find better way to check that input is finished
}

let isStep3ViewExpanded = false;

[
    document.getElementById("toggle-expansion-button"),
    document.getElementById("toggle-depth-expansion-button"),
].forEach((button) =>
    button.addEventListener("click", () => {
        isStep3ViewExpanded = !isStep3ViewExpanded;
        const toToggleElements = Array.from(
            document.getElementsByClassName("hide-on-step-3-expansion"),
        );
        if (isStep3ViewExpanded) {
            toToggleElements.forEach((element) => (element.hidden = true));
            document.getElementById("toggle-expansion-button").title =
                "Collapse picture";
            document.getElementById("toggle-depth-expansion-button").innerHTML =
                "Collapse Picture";
            document.getElementById("step-3").className = "col-12";
        } else {
            toToggleElements.forEach((element) => (element.hidden = false));
            document.getElementById("toggle-expansion-button").title =
                "Expand picture";
            document.getElementById("toggle-depth-expansion-button").innerHTML =
                "Expand Picture";
            document.getElementById("step-3").className = "col-6 col-md-3";
            runStep1();
        }
        document.getElementById("expand-picture-svg").hidden =
            isStep3ViewExpanded;
        document.getElementById("collapse-picture-svg").hidden =
            !isStep3ViewExpanded;
        $('[data-toggle="tooltip"]').tooltip("dispose");
        $('[data-toggle="tooltip"]').tooltip();
    }),
);

function onDepthOverrideDecrease(row, col) {
    onDepthOverrideChange(row, col, false);
}

function onDepthOverrideIncrease(row, col) {
    onDepthOverrideChange(row, col, true);
}

function onDepthOverrideChange(row, col, isIncrease) {
    if (
        !document
            .getElementById("step-3-depth-1-collapse")
            .className.includes("show")
    ) {
        return; // only override if the refine depth section is expanded
    }
    const pixelIndex = 4 * (row * targetResolution[0] + col);
    const step2DepthImagePixels = getPixelArrayFromCanvas(step2DepthCanvas);
    const currentVal =
        overrideDepthPixelArray[pixelIndex] != null
            ? overrideDepthPixelArray[pixelIndex]
            : step2DepthImagePixels[pixelIndex];

    let newVal = currentVal;
    if (isIncrease) {
        newVal = Math.min(
            newVal + 1,
            Number(
                document.getElementById("num-depth-levels-slider").value - 1,
            ),
        );
    } else {
        newVal = Math.max(newVal - 1, 0);
    }

    const pixelDisplayVal = newVal;
    if (newVal === step2DepthImagePixels[pixelIndex]) {
        newVal = null;
    }
    for (var i = 0; i < 3; i++) {
        overrideDepthPixelArray[pixelIndex + i] = newVal;
    }

    if (isStep3ViewExpanded) {
        // do stuff directly on the canvas for perf
        const upscaledPixelDisplayVal = Math.round(
            Math.min(
                (255 * (pixelDisplayVal + 1)) /
                    Number(
                        document.getElementById("num-depth-levels-slider")
                            .value,
                    ),
                255,
            ),
        );
        const radius = SCALING_FACTOR / 2;
        const i = pixelIndex / 4;
        const ctx = step3DepthCanvasUpscaledContext;
        const width = targetResolution[0];
        ctx.beginPath();
        ctx.arc(
            ((i % width) * 2 + 1) * radius,
            (Math.floor(i / width) * 2 + 1) * radius,
            radius,
            0,
            2 * Math.PI,
        );
        ctx.fillStyle = rgbToHex(
            upscaledPixelDisplayVal,
            upscaledPixelDisplayVal,
            upscaledPixelDisplayVal,
        );
        ctx.fill();
    } else {
        runStep3();
    }
}

function onCherryPickColor(row, col) {
    const pixelIndex = 4 * (row * targetResolution[0] + col);
    const isOverridden =
        overridePixelArray[pixelIndex] !== null &&
        overridePixelArray[pixelIndex + 1] !== null &&
        overridePixelArray[pixelIndex + 2] !== null;

    const step3PixelArray = isBleedthroughEnabled()
        ? revertDarkenedImage(
              getPixelArrayFromCanvas(step3Canvas),
              getDarkenedStudsToStuds(
                  ALL_BRICKLINK_SOLID_COLORS.map((color) => color.hex),
              ),
          )
        : getPixelArrayFromCanvas(step3Canvas);

    const colorHex = isOverridden
        ? rgbToHex(
              overridePixelArray[pixelIndex],
              overridePixelArray[pixelIndex + 1],
              overridePixelArray[pixelIndex + 2],
          )
        : rgbToHex(
              step3PixelArray[pixelIndex],
              step3PixelArray[pixelIndex + 1],
              step3PixelArray[pixelIndex + 2],
          );
    document.getElementById(
        "paintbrush-controls",
    ).children[0].children[0].children[0].style.backgroundColor = colorHex;
    const hexName = ALL_BRICKLINK_SOLID_COLORS.find(
        (color) => color.hex === colorHex,
    ).name;
    document
        .getElementById("paintbrush-controls")
        .children[0].setAttribute("title", hexName);
    $('[data-toggle="tooltip"]').tooltip("dispose");
    $('[data-toggle="tooltip"]').tooltip();
}

let activePaintbrushHex = null; // null iff we don't want to paint
let wasPaintbrushUsed = false; // only propogate changes on mouse leave if this is true
let step3CanvasHoveredPixel = null;
let step3CanvasPixelsForHover = null; // only used for perf

function onStep3PaintingMouseLift() {
    activePaintbrushHex = null;
    // propogate changes
    if (!isStep3ViewExpanded && wasPaintbrushUsed) {
        disableInteraction();
        runStep3();
        wasPaintbrushUsed = false;
    }
}

step3CanvasUpscaled.addEventListener(
    "mousedown",
    function (event) {
        wasPaintbrushUsed = true;
        const rawRow =
            event.clientY -
            step3CanvasUpscaled.getBoundingClientRect().y -
            step3CanvasUpscaled.offsetHeight / targetResolution[1] / 2;
        const rawCol =
            event.clientX -
            step3CanvasUpscaled.getBoundingClientRect().x -
            step3CanvasUpscaled.offsetWidth / targetResolution[0] / 2;
        const row = Math.round(
            (rawRow * targetResolution[1]) / step3CanvasUpscaled.offsetHeight,
        );
        const col = Math.round(
            (rawCol * targetResolution[0]) / step3CanvasUpscaled.offsetWidth,
        );
        const rgb = document
            .getElementById("paintbrush-controls")
            .children[0].children[0].children[0].style.backgroundColor.replace(
                "rgb(",
                "",
            )
            .replace(")", "")
            .split(/,\s*/)
            .map((shade) => parseInt(shade));
        activePaintbrushHex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        onMouseMoveOverStep3Canvas(event); // so we paint on a single click
    },
    false,
);

let selectedPaintbrushTool = "paintbrush-tool-dropdown-option";
Array.from(
    document.getElementById("paintbrush-tool-selection-dropdown-options")
        .children,
).forEach((item) => {
    const value = item.id;
    item.addEventListener("click", () => {
        selectedPaintbrushTool = value;
        document.getElementById("paintbrush-color-dropdown").disabled =
            value !== "paintbrush-tool-dropdown-option";
        document.getElementById(
            "paintbrush-tool-selection-dropdown",
        ).innerHTML = item.children[0].innerHTML;
    });
});

let step3PixelArrayForEraser = null;

function onMouseMoveOverStep3Canvas(event) {
    if (!document.getElementById("universal-loading-progress").hidden) {
        return; // ignore this - interaction is disabled because we're loading/working
    }
    const rawRow =
        event.clientY -
        step3CanvasUpscaled.getBoundingClientRect().y -
        step3CanvasUpscaled.offsetHeight / targetResolution[1] / 2;
    const rawCol =
        event.clientX -
        step3CanvasUpscaled.getBoundingClientRect().x -
        step3CanvasUpscaled.offsetWidth / targetResolution[0] / 2;
    const row = Math.round(
        (rawRow * targetResolution[1]) / step3CanvasUpscaled.offsetHeight,
    );
    const col = Math.round(
        (rawCol * targetResolution[0]) / step3CanvasUpscaled.offsetWidth,
    );

    const pixelIndex = 4 * (row * targetResolution[0] + col);
    const i = pixelIndex / 4;
    const ctx = step3CanvasUpscaledContext;
    const width = targetResolution[0];
    const radius = SCALING_FACTOR / 2;

    if (activePaintbrushHex != null) {
        // mouse is clicked down, so we're handling the click

        if (selectedPaintbrushTool === "paintbrush-tool-dropdown-option") {
            const colorRGB = hexToRgb(activePaintbrushHex);
            // we want to paint - update the override pixel array
            // do stuff directly on the canvas for perf
            ctx.beginPath();
            ctx.arc(
                ((i % width) * 2 + 1) * radius,
                (Math.floor(i / width) * 2 + 1) * radius,
                radius,
                0,
                2 * Math.PI,
            );
            ctx.fillStyle = activePaintbrushHex;
            ctx.fill();

            // update the override pixel array in place
            overridePixelArray[pixelIndex] = colorRGB[0];
            overridePixelArray[pixelIndex + 1] = colorRGB[1];
            overridePixelArray[pixelIndex + 2] = colorRGB[2];
        } else if (selectedPaintbrushTool === "eraser-tool-dropdown-option") {
            // null out the override
            if (
                overridePixelArray[pixelIndex] != null &&
                overridePixelArray[pixelIndex + 1] != null &&
                overridePixelArray[pixelIndex + 2] != null
            ) {
                // do stuff directly on the canvas for perf
                ctx.beginPath();
                ctx.arc(
                    ((i % width) * 2 + 1) * radius,
                    (Math.floor(i / width) * 2 + 1) * radius,
                    radius,
                    0,
                    2 * Math.PI,
                );
                ctx.fillStyle = rgbToHex(
                    step3PixelArrayForEraser[pixelIndex],
                    step3PixelArrayForEraser[pixelIndex + 1],
                    step3PixelArrayForEraser[pixelIndex + 2],
                );
                ctx.fill();

                // update the override pixel array in place
                overridePixelArray[pixelIndex] = null;
                overridePixelArray[pixelIndex + 1] = null;
                overridePixelArray[pixelIndex + 2] = null;
            }
        } else {
            // dropper tool
            onCherryPickColor(row, col);
        }
    } else if (pixelIndex + 2 < step3CanvasPixelsForHover.length) {
        // we're not painting - highlight the pixel instead
        const hoveredPixelRGB = [
            step3CanvasPixelsForHover[pixelIndex],
            step3CanvasPixelsForHover[pixelIndex + 1],
            step3CanvasPixelsForHover[pixelIndex + 2],
        ];
        const hoveredPixelHex = rgbToHex(
            hoveredPixelRGB[0],
            hoveredPixelRGB[1],
            hoveredPixelRGB[2],
        );
        ctx.beginPath();
        ctx.arc(
            ((i % width) * 2 + 1) * radius,
            (Math.floor(i / width) * 2 + 1) * radius,
            radius / 2,
            0,
            2 * Math.PI,
        );
        ctx.fillStyle = inverseHex(hoveredPixelHex);
        ctx.fill();
    }

    if (
        step3CanvasHoveredPixel != null &&
        (step3CanvasHoveredPixel[0] !== row ||
            step3CanvasHoveredPixel[1] !== col)
    ) {
        // Clear out old highlight
        const i =
            step3CanvasHoveredPixel[0] * width + step3CanvasHoveredPixel[1];
        const pixelIndex = i * 4;

        ctx.beginPath();
        ctx.arc(
            ((i % width) * 2 + 1) * radius,
            (Math.floor(i / width) * 2 + 1) * radius,
            radius / 2,
            0,
            2 * Math.PI,
        );

        let originalPixelRGB = [
            overridePixelArray[pixelIndex] ||
                step3CanvasPixelsForHover[pixelIndex],
            overridePixelArray[pixelIndex + 1] ||
                step3CanvasPixelsForHover[pixelIndex + 1],
            overridePixelArray[pixelIndex + 2] ||
                step3CanvasPixelsForHover[pixelIndex + 2],
        ];
        const originalPixelHex = rgbToHex(
            originalPixelRGB[0],
            originalPixelRGB[1],
            originalPixelRGB[2],
        );

        ctx.fillStyle = originalPixelHex;
        ctx.fill();
    }
    step3CanvasHoveredPixel = [row, col];
}

step3CanvasUpscaled.addEventListener(
    "mouseup",
    onStep3PaintingMouseLift,
    false,
);

step3CanvasUpscaled.addEventListener(
    "mouseleave",
    () => {
        if (step3CanvasHoveredPixel != null) {
            // Clear out old highlight
            const i =
                step3CanvasHoveredPixel[0] * targetResolution[0] +
                step3CanvasHoveredPixel[1];
            const pixelIndex = i * 4;

            const radius = SCALING_FACTOR / 2;
            step3CanvasUpscaledContext.beginPath();
            step3CanvasUpscaledContext.arc(
                ((i % targetResolution[0]) * 2 + 1) * radius,
                (Math.floor(i / targetResolution[0]) * 2 + 1) * radius,
                radius / 2,
                0,
                2 * Math.PI,
            );

            let originalPixelRGB = [
                overridePixelArray[pixelIndex] ||
                    step3CanvasPixelsForHover[pixelIndex],
                overridePixelArray[pixelIndex + 1] ||
                    step3CanvasPixelsForHover[pixelIndex + 1],
                overridePixelArray[pixelIndex + 2] ||
                    step3CanvasPixelsForHover[pixelIndex + 2],
            ];
            const originalPixelHex = rgbToHex(
                originalPixelRGB[0],
                originalPixelRGB[1],
                originalPixelRGB[2],
            );

            step3CanvasUpscaledContext.fillStyle = originalPixelHex;
            step3CanvasUpscaledContext.fill();
        }

        step3CanvasHoveredPixel = null;
        onStep3PaintingMouseLift();
    },
    false,
);

step3CanvasUpscaled.addEventListener(
    "mousemove",
    onMouseMoveOverStep3Canvas,
    false,
);

let isTouchInBounds = false;
step3CanvasUpscaled.addEventListener(
    "touchstart",
    function (e) {
        isTouchInBounds = true;
        const { clientX, clientY } = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX,
            clientY,
        });
        step3CanvasUpscaled.dispatchEvent(mouseEvent);
    },
    false,
);
step3CanvasUpscaled.addEventListener(
    "touchend",
    function (e) {
        const mouseEvent = new MouseEvent("mouseup", {});
        step3CanvasUpscaled.dispatchEvent(mouseEvent);
    },
    false,
);
step3CanvasUpscaled.addEventListener(
    "touchmove",
    function (e) {
        e.preventDefault(); // prevent scrolling
        if (!isTouchInBounds) {
            return;
        }
        const { clientX, clientY } = e.touches[0];

        let mouseEventType = "mousemove";
        if (
            step3CanvasUpscaled !== document.elementFromPoint(clientX, clientY)
        ) {
            isTouchInBounds = false;
            mouseEventType = "mouseleave";
        }
        const mouseEvent = new MouseEvent(mouseEventType, {
            clientX,
            clientY,
        });
        step3CanvasUpscaled.dispatchEvent(mouseEvent);
    },
    false,
);

step3DepthCanvasUpscaled.addEventListener(
    "contextmenu",
    function (event) {
        event.preventDefault();
        const rawRow =
            event.clientY -
            step3DepthCanvasUpscaled.getBoundingClientRect().y -
            step3DepthCanvasUpscaled.offsetHeight / targetResolution[1] / 2;
        const rawCol =
            event.clientX -
            step3DepthCanvasUpscaled.getBoundingClientRect().x -
            step3DepthCanvasUpscaled.offsetWidth / targetResolution[0] / 2;
        const row = Math.round(
            (rawRow * targetResolution[1]) /
                step3DepthCanvasUpscaled.offsetHeight,
        );
        const col = Math.round(
            (rawCol * targetResolution[0]) /
                step3DepthCanvasUpscaled.offsetWidth,
        );
        onDepthOverrideDecrease(row, col);
    },
    false,
);

step3DepthCanvasUpscaled.addEventListener(
    "click",
    function (event) {
        const rawRow =
            event.clientY -
            step3DepthCanvasUpscaled.getBoundingClientRect().y -
            step3DepthCanvasUpscaled.offsetHeight / targetResolution[1] / 2;
        const rawCol =
            event.clientX -
            step3DepthCanvasUpscaled.getBoundingClientRect().x -
            step3DepthCanvasUpscaled.offsetWidth / targetResolution[0] / 2;
        const row = Math.round(
            (rawRow * targetResolution[1]) /
                step3DepthCanvasUpscaled.offsetHeight,
        );
        const col = Math.round(
            (rawCol * targetResolution[0]) /
                step3DepthCanvasUpscaled.offsetWidth,
        );
        onDepthOverrideIncrease(row, col);
    },
    false,
);

let step3DepthCanvasPixelsForHover = null; // only used for perf
step3DepthCanvasUpscaled.addEventListener("mousemove", function (event) {
    if (
        !document
            .getElementById("step-3-depth-1-collapse")
            .className.includes("show")
    ) {
        return; // only highlight if the refine section is expanded
    }

    const rawRow =
        event.clientY -
        step3DepthCanvasUpscaled.getBoundingClientRect().y -
        step3DepthCanvasUpscaled.offsetHeight / targetResolution[1] / 2;
    const rawCol =
        event.clientX -
        step3DepthCanvasUpscaled.getBoundingClientRect().x -
        step3DepthCanvasUpscaled.offsetWidth / targetResolution[0] / 2;
    const pixelRow = Math.round(
        (rawRow * targetResolution[1]) / step3DepthCanvasUpscaled.offsetHeight,
    );
    const pixelCol = Math.round(
        (rawCol * targetResolution[0]) / step3DepthCanvasUpscaled.offsetWidth,
    );

    if (
        step3CanvasHoveredPixel == null ||
        step3CanvasHoveredPixel[0] != pixelRow ||
        step3CanvasHoveredPixel[1] != pixelCol
    ) {
        const ctx = step3DepthCanvasUpscaled.getContext("2d");

        ctx.lineWidth = 3;
        step4CanvasUpscaledContext.lineWidth = 3;

        const radius = SCALING_FACTOR / 2;
        const width = targetResolution[0];

        const i = pixelRow * width + pixelCol;

        ctx.beginPath();
        ctx.arc(
            ((i % width) * 2 + 1) * radius,
            (Math.floor(i / width) * 2 + 1) * radius,
            radius / 2,
            0,
            2 * Math.PI,
        );
        let hoveredPixelRGB = [
            step3CanvasPixelsForHover[i * 4],
            step3CanvasPixelsForHover[i * 4 + 1],
            step3CanvasPixelsForHover[i * 4 + 2],
        ];
        const hoveredPixelHex = rgbToHex(
            hoveredPixelRGB[0],
            hoveredPixelRGB[1],
            hoveredPixelRGB[2],
        );
        ctx.fillStyle = DEFAULT_COLOR;
        ctx.fill();

        if (step3CanvasHoveredPixel != null) {
            const i =
                step3CanvasHoveredPixel[0] * width + step3CanvasHoveredPixel[1];

            ctx.beginPath();
            ctx.arc(
                ((i % width) * 2 + 1) * radius,
                (Math.floor(i / width) * 2 + 1) * radius,
                radius / 2,
                0,
                2 * Math.PI,
            );

            let originalPixelRGB = [
                step3CanvasPixelsForHover[i * 4],
                step3CanvasPixelsForHover[i * 4 + 1],
                step3CanvasPixelsForHover[i * 4 + 2],
            ];
            const depthValue = step3DepthCanvasPixelsForHover[i * 4];
            const scaledDepthValue = Math.round(
                Math.min(
                    (255 * (depthValue + 1)) /
                        document.getElementById("num-depth-levels-slider")
                            .value,
                    255,
                ),
            );
            const originalPixelHex = rgbToHex(
                originalPixelRGB[0],
                originalPixelRGB[1],
                originalPixelRGB[2],
            );
            const originalDepthPixelHex = rgbToHex(
                scaledDepthValue,
                scaledDepthValue,
                scaledDepthValue,
            );

            ctx.fillStyle = originalDepthPixelHex;
            ctx.fill();
        }
        step3CanvasHoveredPixel = [pixelRow, pixelCol];
    }
});

step3DepthCanvasUpscaled.addEventListener("mouseleave", function (event) {
    const ctx = step3DepthCanvasUpscaled.getContext("2d");

    if (step3CanvasHoveredPixel != null) {
        ctx.beginPath();
        ctx.rect(
            step3CanvasHoveredPixel[1] * SCALING_FACTOR,
            step3CanvasHoveredPixel[0] * SCALING_FACTOR,
            SCALING_FACTOR,
            SCALING_FACTOR,
        );
        ctx.strokeStyle = "#000000";
        ctx.stroke();
        step4CanvasUpscaledContext.beginPath();
        step4CanvasUpscaledContext.rect(
            step3CanvasHoveredPixel[1] * SCALING_FACTOR,
            step3CanvasHoveredPixel[0] * SCALING_FACTOR,
            SCALING_FACTOR,
            SCALING_FACTOR,
        );
        step4CanvasUpscaledContext.strokeStyle = "#000000";
        step4CanvasUpscaledContext.stroke();
    }
    step3CanvasHoveredPixel = null;
});

window.depthPreviewOptions = {};

document.getElementById("step-4-depth-tab").addEventListener("click", () => {
    const targetWidth = step4CanvasUpscaled.clientWidth;
    step4Canvas3dUpscaled.clientWidth = targetWidth;
});

function depthPreviewResize() {
    if (
        // for perf
        document.getElementById("step-4-depth-tab").className.includes("active")
    ) {
        const { app, img, depthMap } = window.depthPreviewOptions;
        const targetWidth = step4Canvas3dUpscaled.clientWidth;
        const targetHeight =
            (targetWidth * targetResolution[1]) / targetResolution[0];
        step4Canvas3dUpscaled.style.height = targetHeight + "px";
        app.renderer.resize(targetWidth, targetHeight);
        img.width = targetWidth;
        img.height = targetHeight;
        depthMap.width = targetWidth;
        depthMap.height = targetHeight;
    }
}

window.addEventListener("resize", depthPreviewResize);

step4Canvas3dUpscaled.addEventListener("mousemove", function (e) {
    if (
        // for perf
        document.getElementById("step-4-depth-tab").className.includes("active")
    ) {
        const { img, displacementFilter } = window.depthPreviewOptions;
        const displacementScale = Number(
            document.getElementById("3d-effect-intensity").value,
        );
        const rawX =
            event.clientX - step4Canvas3dUpscaled.getBoundingClientRect().x;
        const rawY =
            event.clientY - step4Canvas3dUpscaled.getBoundingClientRect().y;
        displacementFilter.scale.x = (img.width / 2 - rawX) * displacementScale;
        displacementFilter.scale.y =
            (img.height / 2 - rawY) * displacementScale;
    }
});
step4Canvas3dUpscaled.addEventListener("mouseleave", function (e) {
    if (
        // for perf
        document.getElementById("step-4-depth-tab").className.includes("active")
    ) {
        const { displacementFilter } = window.depthPreviewOptions;
        displacementFilter.scale.x = 0;
        displacementFilter.scale.y = 0;
    }
});

function runStep4(asyncCallback) {
    const step2PixelArray = getPixelArrayFromCanvas(step2Canvas);
    const step3PixelArray = getPixelArrayFromCanvas(step3Canvas);
    step4Canvas.width = 0;
    try {
        bricklinkCacheCanvas.width = targetResolution[0];
        bricklinkCacheCanvas.height = targetResolution[1];
        step4Canvas.width = targetResolution[0];
        step4Canvas.height = targetResolution[1];
        step4CanvasContext.clearRect(
            0,
            0,
            targetResolution[0],
            targetResolution[1],
        );
        step4CanvasUpscaledContext.clearRect(
            0,
            0,
            targetResolution[0] * SCALING_FACTOR,
            targetResolution[1] * SCALING_FACTOR,
        );

        // save perf by sidestepping step 4 if every available color could
        // theoretically fill the entire image on its owwn
        let shouldSideStepStep4 = true;
        Object.values(selectedStudMap).forEach((count) => {
            if (count < targetResolution[0] * targetResolution[1]) {
                shouldSideStepStep4 = false;
            }
        });

        // There are three reasons step 4 should be identical to step 3
        shouldSideStepStep4 =
            shouldSideStepStep4 ||
            document.getElementById("infinite-piece-count-check").checked ||
            Object.keys(
                quantizationAlgorithmToTraditionalDitheringKernel,
            ).includes(quantizationAlgorithm) ||
            ("" + selectedPixelPartNumber).match("^variable.*$");

        if (!shouldSideStepStep4) {
            const requiredStuds = targetResolution[0] * targetResolution[1];
            let availableStuds = 0;
            Array.from(customStudTableBody.children).forEach((stud) => {
                availableStuds += parseInt(
                    stud.children[1].children[0].children[0].value,
                );
            });
            const missingStuds = Math.max(requiredStuds - availableStuds, 0);
            if (missingStuds > 0) {
                throw "Step 4 failed"; // error will be caught and interaction will be enabled
            }
        }

        let availabilityCorrectedPixelArray;

        // if we're using a traditional error dithering algorithm, this has to be true
        if (shouldSideStepStep4) {
            availabilityCorrectedPixelArray = step3PixelArray;
        } else if (quantizationAlgorithm === "twoPhase") {
            availabilityCorrectedPixelArray = correctPixelsForAvailableStuds(
                step3PixelArray,
                isBleedthroughEnabled()
                    ? getDarkenedStudMap(selectedStudMap)
                    : selectedStudMap,
                step2PixelArray,
                isBleedthroughEnabled()
                    ? getDarkenedImage(overridePixelArray)
                    : overridePixelArray,
                selectedTiebreakTechnique,
                document.getElementById("color-tie-grouping-factor-slider")
                    .value,
                targetResolution[0],
                colorDistanceFunction,
            );
        } else {
            availabilityCorrectedPixelArray =
                correctPixelsForAvailableStudsWithGreedyDynamicDithering(
                    isBleedthroughEnabled()
                        ? getDarkenedStudMap(selectedStudMap)
                        : selectedStudMap,
                    getArrayWithOverridesApplied(
                        step2PixelArray,
                        isBleedthroughEnabled()
                            ? getDarkenedImage(overridePixelArray)
                            : overridePixelArray,
                    ), // apply overrides before running GGD
                    targetResolution[0],
                    colorDistanceFunction,
                    quantizationAlgorithm !== "greedyWithDithering", // skipDithering
                    shouldSideStepStep4, // assumeInfinitePixelCounts
                );
        }

        drawPixelsOnCanvas(availabilityCorrectedPixelArray, step4Canvas);

        const step4QuantizationError = getAverageQuantizationError(
            step2PixelArray,
            availabilityCorrectedPixelArray,
            colorDistanceFunction,
        );
        document.getElementById("step-4-quantization-error").innerHTML =
            step4QuantizationError.toFixed(3);

        setTimeout(async () => {
            step4CanvasUpscaledContext.imageSmoothingEnabled = false;
            const pixelsToDraw = isBleedthroughEnabled()
                ? revertDarkenedImage(
                      availabilityCorrectedPixelArray,
                      getDarkenedStudsToStuds(
                          ALL_BRICKLINK_SOLID_COLORS.map((color) => color.hex),
                      ),
                  )
                : availabilityCorrectedPixelArray;
            drawPixelsOnCanvas(pixelsToDraw, bricklinkCacheCanvas);

            drawStudImageOnCanvas(
                pixelsToDraw,
                targetResolution[0],
                SCALING_FACTOR,
                step4CanvasUpscaled,
                selectedPixelPartNumber,
                step3VariablePixelPieceDimensions,
            );

            // create stud map result table
            const usedPixelsStudMap = getUsedPixelsStudMap(pixelsToDraw);
            const usedPixelsTableBody = document.getElementById(
                "studs-used-table-body",
            );
            usedPixelsTableBody.innerHTML = "";
            const variablePixelsUsed = ("" + selectedPixelPartNumber).match(
                "^variable.*$",
            );
            document.getElementById("pieces-used-dimensions-header").hidden =
                !variablePixelsUsed;
            let pieceCountsForTable = {}; // map piece identifier strings to counts
            if (variablePixelsUsed) {
                const pixelMatrix = convertPixelArrayToMatrix(
                    pixelsToDraw,
                    targetResolution[0],
                );
                step3VariablePixelPieceDimensions.forEach((row, i) => {
                    row.forEach((pixelDimensions, j) => {
                        if (pixelDimensions != null) {
                            const pixelRGB = pixelMatrix[i][j];
                            const pixelHex = rgbToHex(
                                pixelRGB[0],
                                pixelRGB[1],
                                pixelRGB[2],
                            );
                            const sortedPixelDimensions =
                                pixelDimensions[0] < pixelDimensions[1]
                                    ? pixelDimensions
                                    : [pixelDimensions[1], pixelDimensions[0]];
                            studRowKey =
                                pixelHex +
                                "_" +
                                sortedPixelDimensions[0] +
                                PLATE_DIMENSIONS_DEPTH_SEPERATOR +
                                sortedPixelDimensions[1];
                            pieceCountsForTable[studRowKey] =
                                (pieceCountsForTable[studRowKey] || 0) + 1;
                        }
                    });
                });
            } else {
                pieceCountsForTable = usedPixelsStudMap;
            }

            const usedColors = Object.keys(pieceCountsForTable);
            usedColors.sort();
            usedColors.forEach((keyString) => {
                const pieceKey = keyString.split("_");
                const color = pieceKey[0];
                const studRow = document.createElement("tr");
                studRow.style = "height: 1px;";

                const colorCell = document.createElement("td");
                const colorSquare = getColorSquare(color);
                colorCell.appendChild(colorSquare);
                const colorLabel = document.createElement("small");
                colorLabel.innerHTML = HEX_TO_COLOR_NAME[color] || color;
                colorCell.appendChild(colorLabel);
                studRow.appendChild(colorCell);

                if (pieceKey.length > 1) {
                    const dimensionsCell = document.createElement("td");
                    dimensionsCell.style = "height: inherit;";
                    const dimensionsCellChild = document.createElement("div");
                    dimensionsCellChild.style =
                        "height: 100%; display: flex; flex-direction:column; justify-content: center";
                    const dimensionsCellChild2 = document.createElement("div");
                    dimensionsCellChild2.style = "";
                    dimensionsCellChild2.innerHTML = pieceKey[1];

                    dimensionsCellChild.appendChild(dimensionsCellChild2);
                    dimensionsCell.appendChild(dimensionsCellChild);
                    studRow.appendChild(dimensionsCell);
                }

                const numberCell = document.createElement("td");
                numberCell.style = "height: inherit;";
                const numberCellChild = document.createElement("div");
                numberCellChild.style =
                    "height: 100%; display: flex; flex-direction:column; justify-content: center";
                const numberCellChild2 = document.createElement("div");
                numberCellChild2.style = "";
                numberCellChild2.innerHTML = pieceCountsForTable[keyString];

                numberCellChild.appendChild(numberCellChild2);
                numberCell.appendChild(numberCellChild);
                studRow.appendChild(numberCell);

                usedPixelsTableBody.appendChild(studRow);
            });

            const missingPixelsTableBody = document.getElementById(
                "studs-missing-table-body",
            );
            missingPixelsTableBody.innerHTML = "";

            let missingPixelsExist = false;
            if (!shouldSideStepStep4) {
                // create stud map missing pieces table
                const missingPixelsStudMap = studMapDifference(
                    getUsedPixelsStudMap(
                        isBleedthroughEnabled()
                            ? revertDarkenedImage(
                                  step3PixelArray,
                                  getDarkenedStudsToStuds(
                                      ALL_BRICKLINK_SOLID_COLORS.map(
                                          (color) => color.hex,
                                      ),
                                  ),
                              )
                            : step3PixelArray,
                    ),
                    selectedStudMap,
                );
                const usedColors = Object.keys(missingPixelsStudMap);
                usedColors.sort();
                usedColors.forEach((color) => {
                    if (missingPixelsStudMap[color] > 0) {
                        missingPixelsExist = true;
                        const studRow = document.createElement("tr");
                        studRow.style = "height: 1px;";

                        const colorCell = document.createElement("td");
                        const colorSquare = getColorSquare(color);
                        colorCell.appendChild(colorSquare);
                        const colorLabel = document.createElement("small");
                        colorLabel.innerHTML =
                            HEX_TO_COLOR_NAME[color] || color;
                        colorCell.appendChild(colorLabel);
                        studRow.appendChild(colorCell);

                        const numberCell = document.createElement("td");
                        numberCell.style = "height: inherit;";
                        const numberCellChild = document.createElement("div");
                        numberCellChild.style =
                            "height: 100%; display: flex; flex-direction:column; justify-content: center";
                        const numberCellChild2 = document.createElement("div");
                        numberCellChild2.style = "";
                        numberCellChild2.innerHTML =
                            missingPixelsStudMap[color];

                        numberCellChild.appendChild(numberCellChild2);
                        numberCell.appendChild(numberCellChild);
                        studRow.appendChild(numberCell);

                        missingPixelsTableBody.appendChild(studRow);
                    }
                });
            }
            document.getElementById("studs-missing-container").hidden =
                !missingPixelsExist;

            if (asyncCallback) {
                await asyncCallback();
            }
            enableInteraction();
        }, 1); // TODO: find better way to check that input is finished
    } catch (_e) {
        enableInteraction();
    }
}

function addWaterMark(pdf, isHighQuality) {
    for (let i = 0; i < pdf.internal.getNumberOfPages(); i++) {
        pdf.setPage(i + 1);
        pdf.setFontSize(isHighQuality ? 20 : 10);
        pdf.setTextColor(200);
        pdf.text(
            pdf.internal.pageSize.height * 0.25,
            pdf.internal.pageSize.height * 0.3,
            "",
        );
        pdf.text(
            pdf.internal.pageSize.height * 0.25,
            pdf.internal.pageSize.height * 0.3 + 10,
            "",
        );
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function setDPI(canvas, dpi) {
    // Set up CSS size.
    canvas.style.width = canvas.style.width || canvas.width + "px";
    canvas.style.height = canvas.style.height || canvas.height + "px";

    // Get size information.
    var scaleFactor = dpi / 96;
    var width = parseFloat(canvas.style.width);
    var height = parseFloat(canvas.style.height);

    // Backup the canvas contents.
    var oldScale = canvas.width / width;
    var backupScale = scaleFactor / oldScale;
    var backup = canvas.cloneNode(false);
    backup.getContext("2d").drawImage(canvas, 0, 0);

    // Resize the canvas.
    var ctx = canvas.getContext("2d");
    canvas.width = Math.ceil(width * scaleFactor);
    canvas.height = Math.ceil(height * scaleFactor);

    // Redraw the canvas image and scale future draws.
    ctx.setTransform(backupScale, 0, 0, backupScale, 0, 0);
    ctx.drawImage(backup, 0, 0);
    ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
}

async function generateInstructions() {
    const instructionsCanvasContainer = document.getElementById(
        "instructions-canvas-container",
    );
    instructionsCanvasContainer.innerHTML = "";
    disableInteraction();
    runStep4(async () => {
        const isHighQuality = document.getElementById(
            "high-quality-instructions-check",
        ).checked;
        const step4PixelArray = getPixelArrayFromCanvas(step4Canvas);
        const resultImage = isBleedthroughEnabled()
            ? revertDarkenedImage(
                  step4PixelArray,
                  getDarkenedStudsToStuds(
                      ALL_BRICKLINK_SOLID_COLORS.map((color) => color.hex),
                  ),
              )
            : step4PixelArray;

        const titlePageCanvas = document.createElement("canvas");
        instructionsCanvasContainer.appendChild(titlePageCanvas);
        const studMap = getUsedPixelsStudMap(resultImage);
        const filteredAvailableStudHexList = selectedSortedStuds
            .filter((pixelHex) => (studMap[pixelHex] || 0) > 0)
            .filter(function (item, pos, self) {
                return self.indexOf(item) === pos; // remove duplicates
            });
        generateInstructionTitlePage(
            resultImage,
            targetResolution[0],
            PLATE_WIDTH,
            filteredAvailableStudHexList,
            SCALING_FACTOR,
            step4CanvasUpscaled,
            titlePageCanvas,
            selectedPixelPartNumber,
        );
        setDPI(titlePageCanvas, isHighQuality ? HIGH_DPI : LOW_DPI);

        const imgData = titlePageCanvas.toDataURL("image/png", 1.0);

        let pdf = new jsPDF({
            orientation:
                titlePageCanvas.width < titlePageCanvas.height ? "p" : "l",
            unit: "mm",
            format: [titlePageCanvas.width, titlePageCanvas.height],
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const totalPlates =
            resultImage.length / (4 * PLATE_WIDTH * PLATE_WIDTH);

        document.getElementById("pdf-progress-bar").style.width =
            `${100 / (totalPlates + 1)}%`;

        document.getElementById("pdf-progress-bar").style.width = "0%";
        document.getElementById("pdf-progress-container").hidden = false;
        document.getElementById("download-instructions-button").hidden = true;

        pdf.addImage(
            imgData,
            "PNG",
            0,
            0,
            pdfWidth,
            (pdfWidth * titlePageCanvas.height) / titlePageCanvas.width,
        );

        let numParts = 1;
        for (var i = 0; i < totalPlates; i++) {
            await sleep(50);
            if ((i + 1) % (isHighQuality ? 20 : 50) === 0) {
                addWaterMark(pdf, isHighQuality);
                pdf.save(`Lego-Art-Remix-Instructions-Part-${numParts}.pdf`);
                numParts++;
                pdf = new jsPDF({
                    orientation:
                        titlePageCanvas.width < titlePageCanvas.height
                            ? "p"
                            : "l",
                    unit: "mm",
                    format: [titlePageCanvas.width, titlePageCanvas.height],
                });
            } else {
                pdf.addPage();
            }

            document.getElementById("pdf-progress-bar").style.width =
                `${((i + 2) * 100) / (totalPlates + 1)}%`;

            const instructionPageCanvas = document.createElement("canvas");
            instructionsCanvasContainer.appendChild(instructionPageCanvas);

            const subPixelArray = getSubPixelArray(
                resultImage,
                i,
                targetResolution[0],
                PLATE_WIDTH,
            );

            const row = Math.floor((i * PLATE_WIDTH) / targetResolution[0]);
            const col = i % (targetResolution[0] / PLATE_WIDTH);

            const variablePixelPieceDimensionsForPage =
                step3VariablePixelPieceDimensions == null
                    ? null
                    : getSubPixelMatrix(
                          step3VariablePixelPieceDimensions,
                          col * PLATE_WIDTH,
                          row * PLATE_WIDTH,
                          PLATE_WIDTH,
                          PLATE_WIDTH,
                      );
            generateInstructionPage(
                subPixelArray,
                PLATE_WIDTH,
                filteredAvailableStudHexList,
                SCALING_FACTOR,
                instructionPageCanvas,
                i + 1,
                selectedPixelPartNumber,
                variablePixelPieceDimensionsForPage,
            );

            setDPI(instructionPageCanvas, isHighQuality ? HIGH_DPI : LOW_DPI);
            const imgData = instructionPageCanvas.toDataURL(
                `image${i + 1}/jpeg`,
                i,
            );

            pdf.addImage(
                imgData,
                "PNG",
                0,
                0,
                pdfWidth,
                (pdfWidth * instructionPageCanvas.height) /
                    instructionPageCanvas.width,
            );
        }

        addWaterMark(pdf, isHighQuality);
        pdf.save(
            numParts > 1
                ? `Lego-Art-Remix-Instructions-Part-${numParts}.pdf`
                : "Lego-Art-Remix-Instructions.pdf",
        );
        document.getElementById("pdf-progress-container").hidden = true;
        document.getElementById("download-instructions-button").hidden = false;
        enableInteraction();
    });
}

function getUsedPlateMatrices(depthPixelArray) {
    const availableParts = [
        ...document.getElementById("depth-plates-container").children,
    ]
        .map((div) => div.children[0])
        .map((label) => label.children[0])
        .filter((input) => input.checked)
        .map((input) => input.name)
        .map((part) =>
            part
                .split(PLATE_DIMENSIONS_DEPTH_SEPERATOR)
                .map((dimension) => Number(dimension)),
        );
    const flippedParts = [];
    availableParts.forEach((part) => {
        if (part[0] !== part[1]) {
            flippedParts.push([part[1], part[0]]);
        }
    });
    flippedParts.forEach((part) => availableParts.push(part));
    const usedPlatesMatrices = [];
    for (
        let row = 0; // for each row of plates
        row < Math.ceil(targetResolution[1] / PLATE_WIDTH); // round up
        row++
    ) {
        for (
            let col = 0; // for each column of plates
            col < Math.ceil(targetResolution[0] / PLATE_WIDTH); // round up
            col++
        ) {
            const horizontalOffset = col * PLATE_WIDTH;
            const verticalOffset = row * PLATE_WIDTH;
            const depthSubPixelMatrix = getDepthSubPixelMatrix(
                depthPixelArray,
                targetResolution[0],
                horizontalOffset,
                verticalOffset,
                Math.min(PLATE_WIDTH, targetResolution[0] - horizontalOffset),
                Math.min(PLATE_WIDTH, targetResolution[1] - verticalOffset),
            );
            const perDepthLevelMatrices = [];
            for (
                let depthLevel = 0; // for each depth level
                depthLevel <
                Number(
                    document.getElementById("num-depth-levels-slider").value,
                ) -
                    1;
                depthLevel++
            ) {
                const setPixelMatrix = getSetPixelMatrixFromInputMatrix(
                    depthSubPixelMatrix,
                    (depthPixel, _i, _j) => depthPixel <= depthLevel,
                );
                perDepthLevelMatrices.push(
                    getRequiredPartMatrixFromSetPixelMatrix(
                        setPixelMatrix,
                        availableParts,
                    ),
                );
            }
            usedPlatesMatrices.push(perDepthLevelMatrices);
        }
    }
    return usedPlatesMatrices;
}

async function generateDepthInstructions() {
    const instructionsCanvasContainer = document.getElementById(
        "depth-instructions-canvas-container",
    );
    instructionsCanvasContainer.innerHTML = "";
    disableInteraction();

    runStep4(async () => {
        const isHighQuality = document.getElementById(
            "high-quality-depth-instructions-check",
        ).checked;
        const depthPixelArray = getPixelArrayFromCanvas(step3DepthCanvas);

        const usedPlatesMatrices = getUsedPlateMatrices(depthPixelArray);

        document.getElementById("depth-pdf-progress-bar").style.width = `${0}%`;

        document.getElementById("depth-pdf-progress-bar").style.width = "0%";
        document.getElementById("depth-pdf-progress-container").hidden = false;
        document.getElementById("download-depth-instructions-button").hidden =
            true;

        const titlePageCanvas = document.createElement("canvas");
        instructionsCanvasContainer.innerHTML = "";
        instructionsCanvasContainer.appendChild(titlePageCanvas);
        generateDepthInstructionTitlePage(
            usedPlatesMatrices,
            targetResolution,
            SCALING_FACTOR,
            titlePageCanvas,
            step3DepthCanvasUpscaled,
            PLATE_WIDTH,
        );
        setDPI(titlePageCanvas, isHighQuality ? HIGH_DPI : LOW_DPI);

        const imgData = titlePageCanvas.toDataURL(`image_title/jpeg`, 1.0);

        let pdf = new jsPDF({
            orientation:
                titlePageCanvas.width < titlePageCanvas.height ? "p" : "l",
            unit: "mm",
            format: [titlePageCanvas.width, titlePageCanvas.height],
        });

        pdf.addImage(
            imgData,
            "PNG",
            0,
            0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight(),
        );

        let numParts = 1;
        for (let i = 0; i < usedPlatesMatrices.length; i++) {
            await sleep(50);

            if ((i + 1) % (isHighQuality ? 20 : 50) === 0) {
                if (pdf != null) {
                    addWaterMark(pdf, isHighQuality);
                    pdf.save(
                        `Lego-Art-Remix-Instructions-Part-${numParts}.pdf`,
                    );

                    numParts++;
                }
                pdf = new jsPDF({
                    orientation:
                        titlePageCanvas.width < titlePageCanvas.height
                            ? "p"
                            : "l",
                    unit: "mm",
                    format: [titlePageCanvas.width, titlePageCanvas.height],
                });
            } else {
                pdf.addPage();
            }

            const instructionPageCanvas = document.createElement("canvas");
            instructionsCanvasContainer.innerHTML = "";
            instructionsCanvasContainer.appendChild(instructionPageCanvas);

            perDepthLevelMatrices = usedPlatesMatrices[i];
            generateDepthInstructionPage(
                perDepthLevelMatrices,
                SCALING_FACTOR,
                instructionPageCanvas,
                i + 1,
            );
            setDPI(instructionPageCanvas, isHighQuality ? HIGH_DPI : LOW_DPI);

            const imgData = instructionPageCanvas.toDataURL(
                `image${i + 1}/jpeg`,
                i,
            );

            pdf.addImage(
                imgData,
                "PNG",
                0,
                0,
                pdf.internal.pageSize.getWidth(),
                pdf.internal.pageSize.getHeight(),
            );

            document.getElementById("depth-pdf-progress-bar").style.width = `${
                ((i + 1) * 100) / (usedPlatesMatrices.length + 1)
            }%`;
        }

        addWaterMark(pdf, isHighQuality);
        pdf.save(
            numParts > 1
                ? `Lego-Art-Remix-Instructions-Part-${numParts}.pdf`
                : "Lego-Art-Remix-Instructions.pdf",
        );
        document.getElementById("depth-pdf-progress-container").hidden = true;
        document.getElementById("download-depth-instructions-button").hidden =
            false;
        enableInteraction();
    });
}

document
    .getElementById("download-instructions-button")
    .addEventListener("click", async () => {
        await generateInstructions();
    });

document
    .getElementById("download-depth-instructions-button")
    .addEventListener("click", async () => {
        await generateDepthInstructions();
    });

document
    .getElementById("export-depth-to-bricklink-button")
    .addEventListener("click", () => {
        disableInteraction();
        const depthPixelArray = getPixelArrayFromCanvas(step3DepthCanvas);
        const usedPlatesMatrices = getUsedPlateMatrices(depthPixelArray);
        const depthPartsMap = getUsedDepthPartsMap(usedPlatesMatrices.flat());

        navigator.clipboard
            .writeText(getDepthWantedListXML(depthPartsMap))
            .then(
                function () {
                    enableInteraction();
                },
                function (err) {
                    console.error("Async: Could not copy text: ", err);
                },
            );
    });

const SERIALIZE_EDGE_LENGTH = 512;

function handleInputImage(e, dontClearDepth, dontLog) {
    const reader = new FileReader();
    reader.onload = function (event) {
        inputImage = new Image();
        inputImage.onload = function () {
            inputCanvas.width = SERIALIZE_EDGE_LENGTH;
            inputCanvas.height = SERIALIZE_EDGE_LENGTH;
            inputCanvasContext.drawImage(
                inputImage,
                0,
                0,
                inputImage.width,
                inputImage.height,
                0,
                0,
                SERIALIZE_EDGE_LENGTH,
                SERIALIZE_EDGE_LENGTH,
            );

            // remove transparency
            const inputImagePixels = getPixelArrayFromCanvas(inputCanvas);
            for (var i = 3; i < inputImagePixels.length; i += 4) {
                inputImagePixels[i] = 255;
            }
            drawPixelsOnCanvas(inputImagePixels, inputCanvas);

            if (!dontClearDepth) {
                inputDepthCanvas.width = SERIALIZE_EDGE_LENGTH;
                inputDepthCanvas.height = SERIALIZE_EDGE_LENGTH;
                inputDepthCanvasContext.fillStyle = "black";
                inputDepthCanvasContext.fillRect(
                    0,
                    0,
                    inputDepthCanvas.width,
                    inputDepthCanvas.height,
                );
            }
        };
        inputImage.src = event.target.result;
        document.getElementById("steps-row").hidden = false;
        document.getElementById("input-image-selector").innerHTML =
            "Reselect Input Image";
        document
            .getElementById("image-input-new")
            .appendChild(document.getElementById("image-input"));
        document.getElementById("image-input-card").hidden = true;
        document.getElementById("run-example-input-container").hidden = true;
        setTimeout(() => {
            step1CanvasUpscaled.width = SERIALIZE_EDGE_LENGTH;
            step1CanvasUpscaled.height = Math.floor(
                (SERIALIZE_EDGE_LENGTH * inputImage.height) / inputImage.width,
            );
            step1CanvasUpscaledContext.drawImage(
                inputCanvas,
                0,
                0,
                SERIALIZE_EDGE_LENGTH,
                SERIALIZE_EDGE_LENGTH,
                0,
                0,
                step1CanvasUpscaled.width,
                step1CanvasUpscaled.height,
            );

            overridePixelArray = new Array(
                targetResolution[0] * targetResolution[1] * 4,
            ).fill(null);
            overrideDepthPixelArray = new Array(
                targetResolution[0] * targetResolution[1] * 4,
            ).fill(null);
            initializeCropper();
            runStep1();
        }, 50);
    };
    reader.readAsDataURL(e.target.files[0]);
}

const imageSelectorHidden = document.getElementById(
    "input-image-selector-hidden",
);
imageSelectorHidden.addEventListener(
    "change",
    (e) => handleInputImage(e),
    false,
);
document
    .getElementById("input-image-selector")
    .addEventListener("click", () => {
        imageSelectorHidden.click();
    });

enableInteraction();
