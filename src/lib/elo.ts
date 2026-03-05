export interface EloPlayerInput {
    id: string;
    eloAncien: number;
    rang: number;
}

export interface EloPlayerOutput extends EloPlayerInput {
    variationTotale: number;
    eloNouveau: number;
}

export function calculateMatchElo(players: EloPlayerInput[]): EloPlayerOutput[] {
    const nbJoueurs = players.length;
    if (nbJoueurs < 2) {
        throw new Error("Il faut au moins 2 joueurs.");
    }

    const K = 32;
    const K_ajuste = K / (nbJoueurs - 1);

    const outputs: EloPlayerOutput[] = players.map(p => ({
        ...p,
        variationTotale: 0,
        eloNouveau: 0
    }));

    let sumVariationsRounded = 0;
    for (let i = 0; i < nbJoueurs; i++) {
        let variationCumulee = 0;

        for (let j = 0; j < nbJoueurs; j++) {
            if (i === j) continue;

            const joueurA = outputs[i];
            const joueurB = outputs[j];

            const probaA = 1 / (1 + Math.pow(10, (joueurB.eloAncien - joueurA.eloAncien) / 400));

            let resultatReelA = 0;
            if (joueurA.rang < joueurB.rang) {
                resultatReelA = 1;
            } else if (joueurA.rang === joueurB.rang) {
                resultatReelA = 0.5;
            } else {
                resultatReelA = 0;
            }

            variationCumulee += K_ajuste * (resultatReelA - probaA);
        }

        if (i < nbJoueurs - 1) {
            outputs[i].variationTotale = Math.round(variationCumulee);
            sumVariationsRounded += outputs[i].variationTotale;
        } else {
            // Force strict zero-sum for the last player to counteract rounding drift
            outputs[i].variationTotale = -sumVariationsRounded;
        }

        outputs[i].eloNouveau = outputs[i].eloAncien + outputs[i].variationTotale;
    }

    return outputs;
}
