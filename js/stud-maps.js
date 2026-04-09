const availableTileHexes = BRICKLINK_TILE_COLORS.map((color) => color.hex);
const tileHexToCount = {};
availableTileHexes.forEach((hex) => {
    tileHexToCount[hex] = 99999;
});

STUD_MAPS = {
    all_tile_colors: {
        name: "All Tile Colors",
        officialName: "All Available Tile Colors",
        sortedStuds: availableTileHexes,
        studMap: tileHexToCount,
    },
};

const availableStudHexes = BRICKLINK_STUD_COLORS.map((color) => color.hex);
const studHexToCount = {};
availableStudHexes.forEach((hex) => {
    studHexToCount[hex] = 99999;
});

const availableSolidHexes = ALL_BRICKLINK_SOLID_COLORS.map(
    (color) => color.hex,
);
const solidHexToCount = {};
availableSolidHexes.forEach((hex) => {
    solidHexToCount[hex] = 99999;
});
