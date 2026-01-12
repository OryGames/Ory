/**
 * Command Interpreter
 * 
 * Commands are arrays of lines, where each line is an array of block labels.
 * Example: [['inicio'], ['andar', 'seta_right', '3'], ['pular', '2']]
 * 
 * Line parsing:
 * - Each line forms a single command
 * - Actions: andar, pular, pegar
 * - Directions: seta_up, seta_down, seta_left, seta_right
 * - Multipliers: 2, 3, 4, 5, 6, 7, 8, 9
 * - Control: inicio, looping
 * 
 * Loops:
 * - looping starts a loop block
 * - inicio ends the loop
 * - Commands between looping and inicio are repeated (default 2x, or use number)
 */
class Interpreter {
    static async execute(commandLines, robot, scene) {
        console.log("Interpreter executing lines:", commandLines);

        // Play command sound once when starting to process commands
        const settings = Interpreter.loadSettings();
        if (settings.soundEnabled && scene.sound && scene.cache.audio.exists('cmd_sound')) {
            const cmdSound = scene.sound.get('cmd_sound') || scene.sound.add('cmd_sound', { loop: false, volume: 0.8 });
            cmdSound.play();
        }

        // First, find loop structures
        const { commands, loops } = Interpreter.parseLoops(commandLines);

        // Execute commands
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];

            if (cmd.type === 'loop') {
                // Execute loop contents multiple times
                const repeatCount = cmd.count || 2;
                for (let r = 0; r < repeatCount; r++) {
                    console.log(`Loop iteration ${r + 1}/${repeatCount}`);
                    for (const loopCmd of cmd.commands) {
                        await Interpreter.executeCommand(loopCmd, robot, scene);
                    }
                }
            } else {
                await Interpreter.executeCommand(cmd, robot, scene);
            }
        }

        console.log("Execution finished");
    }

    static parseLoops(lines) {
        const commands = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const parsed = Interpreter.parseLine(line);

            if (parsed.action === 'inicio' && commands.length === 0) {
                // Skip starting 'inicio'
                i++;
                continue;
            }

            if (parsed.action === 'looping') {
                // Start of loop - find matching 'inicio' to end it
                const loopCommands = [];
                const loopCount = parsed.count || 2;
                i++;

                while (i < lines.length) {
                    const loopLine = lines[i];
                    const loopParsed = Interpreter.parseLine(loopLine);

                    if (loopParsed.action === 'inicio') {
                        // End of loop
                        break;
                    }

                    loopCommands.push(loopParsed);
                    i++;
                }

                commands.push({
                    type: 'loop',
                    count: loopCount,
                    commands: loopCommands
                });
            } else if (parsed.action !== 'inicio') {
                commands.push(parsed);
            }

            i++;
        }

        return { commands, loops: [] };
    }

    static parseLine(line) {
        // Parse a single line into a command object
        // Line example: ['andar', 'seta_right', '3']

        const result = {
            action: null,
            direction: null,
            count: 1
        };

        for (const token of line) {
            // Check if it's an action
            if (['andar', 'pular', 'pegar', 'inicio', 'looping', 'circulo', 'triangulo', 'zzz'].includes(token)) {
                result.action = token;
            }
            // Check if it's a direction
            else if (token.startsWith('seta_')) {
                result.direction = token;
            }
            // Check if it's a number
            else if (['2', '3', '4', '5', '6', '7', '8', '9'].includes(token)) {
                result.count = parseInt(token);
            }
        }

        return result;
    }

    static async executeCommand(cmd, robot, scene) {
        console.log("Executing:", cmd);

        // Skip decorative/ignored blocks
        if (['circulo', 'triangulo', 'zzz'].includes(cmd.action)) {
            return;
        }

        // Apply direction first if present
        if (cmd.direction) {
            if (cmd.direction === 'seta_up') robot.face(0);
            if (cmd.direction === 'seta_right') robot.face(1);
            if (cmd.direction === 'seta_down') robot.face(2);
            if (cmd.direction === 'seta_left') robot.face(3);
            await Interpreter.delay(250);
        }

        // Then execute action
        if (cmd.action === 'andar') {
            await robot.moveForward(cmd.count);
        }
        else if (cmd.action === 'pular') {
            await robot.jump(cmd.count);
        }
        else if (cmd.action === 'pegar') {
            scene.collectAtPosition(robot.gridX, robot.gridY);
            await Interpreter.delay(300);
        }

        // Small delay between commands
        await Interpreter.delay(150);
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static loadSettings() {
        const defaults = {
            musicEnabled: true,
            soundEnabled: true,
            gridEnabled: false
        };

        try {
            const saved = localStorage.getItem('ory_settings');
            if (saved) {
                return { ...defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }

        return defaults;
    }
}
