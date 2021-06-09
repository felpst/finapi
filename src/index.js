const express = require('express');
const {v4: uuidv4} = require("uuid"); // A v4 gera a uuid a partir de números randomicos. Tive que adicionar ela usando yarn add uuid. Estou renomeando a função para uuidv4.

const app = express();

app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(req, res, next) { // next é o que define se o middleware vai prosseguir com a opeção dele, ou se vai parar onde está.
    const { cpf } = req.headers; // Pegando o cpf no header do request.

    const customer = customers.find(customer => customer.cpf === cpf); // Parecido com o some, mas retorna o objeto quando achado.

    if(!customer)
    {
        return res.status(400).json({error: "Customer not found"});
    }

    req.customer = customer; // Todo que chamarem esta função terão acesso ao customer.

    return next();
}

/**
 * cpf - string
 * name - string
 * id - uuid <-- universally unique identifier
 * statement []
*/
app.post("/accounts", (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf); // To verificando se já existe um user com o mesmo cpf que está tentando ser cadastrado agora. Aqui só retorna uma boolean (True or False).

    if(customerAlreadyExists)
    {
        return res.status(400).json({ error: "Customer already exists!"});
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return res.status(201).send(); // Aqui, caso tudo de certo, eu retorno a resposta com o status 201 indicando que tudo deu certo.
})

// app.use(verifyIfExistsAccountCPF) --> quando eu precisar que todas as minhas rotas tenham este middleware, então declarar desta forma.

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => { // Aqui eu estou colocando o middleware de verificaçao de CPF. para adicionar outras middleware é colocar um virgula e o nome do middleware.
    const { customer } = req; // Pegando o customer que foi passado pelo middleware.
    return res.json(customer.statement);
})

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body; // Como estou trabalhando com o post eu vou pegar de dentro do body.

    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit",
    }

    customer.statement.push(statementOperation);

    return res.status(201).send();
})

app.listen(3030);