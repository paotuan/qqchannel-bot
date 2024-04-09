const { DiceRoller, NumberGenerator } = require('@dice-roller/rpg-dice-roller')

const generator = NumberGenerator.generator
// use a custom engine
generator.engine = {
  next() {
    return 1
  }
}

const roller = new DiceRoller()
for (let i = 0; i < 10; i++) {
  const roll = roller.roll('2d10')
  console.log(roll.total)
}
