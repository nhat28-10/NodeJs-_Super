import express from 'express'
import usersRouter from './routes/users.routes'
const app = express()
const port = 3000
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello word')
})

app.use('/users', usersRouter)
app.listen(port, () => {
  console.log(`Example app listen on port ${port}`)
})
