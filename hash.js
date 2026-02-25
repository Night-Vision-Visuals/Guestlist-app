const bcrypt = require("bcryptjs")

async function hash() {
  const hash = await bcrypt.hash("test", 10)
  console.log(hash)
}

hash()