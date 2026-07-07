export type HandClass = string;

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * Deterministically generates the 169 HandClass matrix following typical poker grid standards.
 * Rows = Hand Rank 1, Cols = Hand Rank 2
 * Diagonal = Pairs (e.g. AA, KK)
 * Top Right = Suited (e.g. AKs)
 * Bottom Left = Offsuit (e.g. AKo)
 */
export function getHandMatrix(): HandClass[][] {
    const matrix: HandClass[][] = [];

    for (let i = 0; i < RANKS.length; i++) {
        const row: HandClass[] = [];
        for (let j = 0; j < RANKS.length; j++) {
            const rank1 = RANKS[i];
            const rank2 = RANKS[j];

            if (i === j) {
                row.push(`${rank1}${rank2}`); // Pair
            } else if (i < j) {
                row.push(`${rank1}${rank2}s`); // Suited
            } else {
                row.push(`${rank2}${rank1}o`); // Offsuit (Rank2 is the higher rank visually going left-down)
            }
        }
        matrix.push(row);
    }

    return matrix;
}
