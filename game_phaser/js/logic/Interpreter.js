class Interpreter {
    static async execute(commands, robot) {
        console.log("Interpreter executing:", commands);

        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];

            // Check for arguments (Next block is a number?)
            let steps = 1;
            if (i + 1 < commands.length) {
                const next = commands[i + 1];
                if (!isNaN(parseInt(next))) {
                    steps = parseInt(next);
                    i++; // Skip next block as it is consumed
                }
            }

            // Actions
            if (cmd.startsWith('seta_')) {
                // Direction change
                if (cmd === 'seta_up') robot.face(0);
                if (cmd === 'seta_right') robot.face(1);
                if (cmd === 'seta_down') robot.face(2);
                if (cmd === 'seta_left') robot.face(3);

                // If the user wants "Turn Right" relative to current, that's different.
                // But 'seta_right' implies absolute "Face Right" usually? 
                // Let's assume absolute for now, or maybe the arrow block just means "Turn that way relative"? 
                // Let's implement absolute facing for stability.

                // Wait for rotation
                await new Promise(r => setTimeout(r, 300));
            }
            else if (cmd === 'andar') {
                await robot.moveForward(steps);
            }
            else if (cmd === 'pular') {
                // Jump = 2 steps + hop animation?
                // For now, move 2 steps or jump over 1 tile
                await robot.moveForward(steps * 2);
            }
            else if (cmd === 'pegar') {
                // Interact?
                console.log("Picking up item");
                await new Promise(r => setTimeout(r, 500));
            }

            // Basic delay between actions
            await new Promise(r => setTimeout(r, 200));
        }

        console.log("Execution finished");
    }
}
