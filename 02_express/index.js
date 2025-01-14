import express from 'express';

const app = express();
const port = 3000;
app.use(express.json());
let teaData = []
let nextId = 1
// post a tea 
app.post('/tea', (req, res) => {
    const {name, price} = req.body
    const newTea = {id: nextId++, name, price}
    teaData.push(newTea)
    res.status(201).send(newTea)
})
// get all tea
app.get('/tea', (req, res) => {
    res.status(200).send(teaData)
})
// get a tea by id
app.get('/tea/:id', (req, res) => {
    const tea = teaData.find(t => t.id === parseInt(req.params.id))
    if(!tea){
        return res.status(404).send('Tea not found')
    }
    res.status(200).send(tea)
})
// update a tea by id

app.put('/tea/:id', (req,res) => {
    const tea = teaData.find(t => t.id === parseInt(req.params.id))
    if(!tea){
        return res.status(404).send('Tea not found')
    }
    const {name, price} = req.body
    tea.name = name
    tea.price = price
    res.status(200).send(tea)
})

// delete a tea

app.delete('/tea/:id', (req, res) => {
    const index = teaData.filter(t => t.id !== parseInt(req.params.id))
    if(index === -1){
        return res.status(404).send('Tea not found')
        teaData.splice(index, 1)
        return res.status(204).send('Tea deleted')
    }
})
app.listen(port, () => {
    console.log(`Server is running at port: ${port}...`);
})