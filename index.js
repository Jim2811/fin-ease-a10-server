const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000;
app.use(cors())

app.get('/', (req, res) => {
  res.send('FinEase Server is running')
})

app.listen(port, () => {
  console.log(`FinEase Server listening on port ${port}`)
})