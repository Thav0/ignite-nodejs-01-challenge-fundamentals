const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (username === undefined) {
    return response.status(400).json({ error: "Header username not found" });
  }

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checksExistsUserAccountTodo(request, response, next) {
  const { id: todoId } = request.params;

  const checkTodoExisits = request.user.todos.find(
    (todo) => todo.id === todoId
  );

  if (!checkTodoExisits) {
    return response.status(404).json({ error: "Todo id not found" });
  }

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const checkIfUserExists = users.find((user) => user.username === username);

  if (checkIfUserExists) {
    return response.status(400).json({ error: "User already exists" });
  }

  const newUser = {
    name,
    username,
    id: uuidv4(),
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  return response.status(200).json(request.user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const requestUser = request.user;
  const { title: todoTitle, deadline } = request.body;

  const userIndex = users.findIndex(
    (user) => user.username === requestUser.username
  );
  const newTodo = {
    id: uuidv4(),
    title: todoTitle,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  requestUser.todos.push(newTodo);

  users[userIndex] = requestUser;

  return response.status(201).json(newTodo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsUserAccountTodo,
  (request, response) => {
    const { user: userFromRequest } = request;
    const { id: todoToBeUpdated } = request.params;
    const { title: newTitle, deadline: newDeadline } = request.body;
    const userIndex = users.findIndex(
      (user) => user.username === userFromRequest.username
    );
    const todoIndex = users[userIndex].todos.findIndex(
      (todo) => todo.id === todoToBeUpdated
    );

    users[userIndex].todos[todoIndex].title = newTitle;
    users[userIndex].todos[todoIndex].deadline = new Date(newDeadline);

    return response.status(200).json(users[userIndex].todos[todoIndex]);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsUserAccountTodo,
  (request, response) => {
    const { user: userFromRequest } = request;
    const { id: todoToBeUpdated } = request.params;
    const userIndex = users.findIndex(
      (user) => user.username === userFromRequest.username
    );
    const todoIndex = users[userIndex].todos.findIndex(
      (todo) => todo.id === todoToBeUpdated
    );

    users[userIndex].todos[todoIndex].done = true;

    return response.status(200).json(users[userIndex].todos[todoIndex]);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsUserAccountTodo,
  (request, response) => {
    const { user: userFromRequest } = request;
    const { id: todoIdToBeRemoved } = request.params;
    const userIndex = users.findIndex(
      (user) => user.username === userFromRequest.username
    );

    users[userIndex].todos = userFromRequest.todos.filter(
      (todo) => todo.id !== todoIdToBeRemoved
    );

    return response.status(204).json();
  }
);

module.exports = app;
