// Canonical physical scale. A standing avatar is three blocks / 48 microcells.
export const BLOCK_SIZE=1;
export const MICRO_PER_BLOCK=16;
export const MICRO_SIZE=BLOCK_SIZE/MICRO_PER_BLOCK;
export const PLAYER_HEIGHT_BLOCKS=3;
export const PLAYER_HEIGHT=PLAYER_HEIGHT_BLOCKS*BLOCK_SIZE;
export const PLAYER_HEIGHT_MICRO=PLAYER_HEIGHT/MICRO_SIZE;
