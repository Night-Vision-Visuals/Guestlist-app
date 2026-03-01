const bcrypt = require("bcryptjs")

async function hash() {
  const hash = await bcrypt.hash("123456", 10)
  console.log(hash)
}

hash()