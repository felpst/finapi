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

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === "credit"){
            return acc + operation.amount;
        }
        else{
            return acc - operation.amount;
        }
    }, 0); //Pega as informações dos valores que são passados e transforma tudo em um só valor. O acc é a variável responsável para ir adicionando ou removendo os valores que serão adicionados. Aqui o acc foi iniciado como 0;
    return balance;
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

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return res.status(400).json({error: "Insufficient funds!"});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => { 
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00"); // Adicionando a hora "00:00" eu consigo fazer a busca do dia independente da hora.

    const statement = customer.statement.filter(
        (statement) => 
        statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    );

    return res.json(statement);
})

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return res.status(201).send();
})

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer);
})

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    // splice
    customers.splice(customer, 1); // Primeiro parâmetro é para indicar onde o splice deve começar, o segundo parâmetro é para indicar quantos elementos ele deve remover.

    return res.status(200).json(customers);
})

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const balance = getBalance(customer.statement);

    return res.json(balance);
})

app.listen(3030);