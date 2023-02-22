const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();

module.exports = app;
const filePath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());

const convertingCamelcase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://loacalhost:3000");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
  }
};
initializerDbAndServer();

//get API 1
app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  let data = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status ='${status}';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachData) => convertingCamelcase(eachData)));
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachData) => convertingCamelcase(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%'
               AND  status ='${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachData) => convertingCamelcase(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case hasCategoryAndStatusProperty(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%'
               AND  status ='${status}'
               AND category = '${category}';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachData) => convertingCamelcase(eachData)));

      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%'
               AND category = '${category}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachData) => convertingCamelcase(eachData)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriorityProperty(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}
               AND category = '${category}';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachData) => convertingCamelcase(eachData)));

      break;

    default:
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%'`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachData) => convertingCamelcase(eachData)));
  }
});

//get API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId}`;
  const todo = await db.get(getTodoQuery);
  response.send(convertingCamelcase(todo));
});

//get API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodosQuery = `
        SELECT *
        FROM todo
        WHERE due_date = '${newDate}'`;
    const todo = await db.all(getTodosQuery);
    response.send(todo.map((eachTodo) => convertingCamelcase(eachTodo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//post API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
            INSERT INTO 
                todo(id, todo, priority, status, category, due_date)
            VALUES (
                ${id},
                '${todo}',
                '${priority}',
                '${status}',
                '${category}',
                '${newDate}'
                );`;
          await db.run(addTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//put API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";

  const previousTodoQuery = `
            SELECT *
            FROM todo
            WHERE id = ${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  console.log(previousTodo);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  switch (true) {
    case request.body.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const updateTodoQuery = `
        UPDATE todo
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status ='${status}',
            category = '${category}',
            due_date ='${dueDate}';';
        WHERE 
            id = ${todoId};`;

        const dbUser = await db.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case request.body.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const updateTodoQuery = `
        UPDATE todo
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status ='${status}',
            category = '${category}',
            due_date ='${dueDate}';';
        WHERE 
            id = ${todoId};`;

        const dbUser = await db.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case request.body.todo !== undefined:
      const updateTodoQuery = `
        UPDATE todo
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status ='${status}',
            category = '${category}',
            due_date ='${dueDate}';';
        WHERE 
            id = ${todoId};`;

      const dbUser = await db.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    case request.body.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const updateTodoQuery = `
        UPDATE todo
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status ='${status}',
            category = '${category}',
            due_date ='${dueDate}';';
        WHERE 
            id = ${todoId};`;

        const dbUser = await db.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case request.body.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        const updateTodoQuery = `
        UPDATE todo
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status ='${status}',
            category = '${category}',
            due_date ='${newDate}';';
        WHERE 
            id = ${todoId};`;

        const dbUser = await db.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//delete API 6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteUserQuery = `
        DELETE FROM todo
        
        WHERE id = ${todoId};`;
  await db.run(deleteUserQuery);
  response.send("Todo Deleted");
});
