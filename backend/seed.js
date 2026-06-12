require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─── Models (inline to avoid import issues) ───────────────────────────────────
const User    = require('./src/models/User');
const Course  = require('./src/models/Course');
const Module  = require('./src/models/Module');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');
};

// ══════════════════════════════════════════════════════════════
// SEED DATA
// ══════════════════════════════════════════════════════════════

const users = [
  {
    email: 'admin@adaptlearn.ru',
    password: 'admin123',
    role: 'admin',
    profile: { firstName: 'Admin', lastName: 'System' }
  },
  {
    email: 'instructor@adaptlearn.ru',
    password: 'instructor123',
    role: 'instructor',
    profile: { firstName: 'Алексей', lastName: 'Петров', bio: 'Senior разработчик с 10 лет опыта' }
  },
  {
    email: 'student@adaptlearn.ru',
    password: 'student123',
    role: 'student',
    profile: { firstName: 'Иван', lastName: 'Иванов' }
  }
];

// Modules per course
const courseModules = {
  'JavaScript для начинающих': [
    {
      title: 'Введение в JavaScript',
      type: 'text',
      difficulty: 1,
      estimatedMinutes: 10,
      learningObjectives: ['Понять что такое JavaScript', 'Узнать историю языка'],
      content: {
        body: `<h2>Что такое JavaScript?</h2>
<p>JavaScript — это высокоуровневый, интерпретируемый язык программирования, который является одним из основных технологий Всемирной паутины. Он позволяет создавать интерактивные веб-страницы.</p>
<h3>История</h3>
<p>JavaScript был создан Бренданом Эйхом в 1995 году за 10 дней. Изначально назывался Mocha, затем LiveScript, и наконец JavaScript.</p>
<h3>Где используется?</h3>
<ul>
<li>Веб-браузеры (frontend)</li>
<li>Серверы (Node.js)</li>
<li>Мобильные приложения (React Native)</li>
<li>Десктопные приложения (Electron)</li>
</ul>`
      }
    },
    {
      title: 'Переменные и типы данных',
      type: 'text',
      difficulty: 1,
      estimatedMinutes: 15,
      learningObjectives: ['Научиться объявлять переменные', 'Понять типы данных JS'],
      content: {
        body: `<h2>Переменные в JavaScript</h2>
<p>В JavaScript есть три способа объявить переменную:</p>
<pre><code>var x = 5;    // устаревший способ
let y = 10;   // современный, изменяемый
const z = 15; // константа, неизменяемая</code></pre>
<h3>Типы данных</h3>
<ul>
<li><strong>Number</strong> — числа: 42, 3.14</li>
<li><strong>String</strong> — строки: "Hello"</li>
<li><strong>Boolean</strong> — true / false</li>
<li><strong>Array</strong> — массивы: [1, 2, 3]</li>
<li><strong>Object</strong> — объекты: { name: "Ivan" }</li>
<li><strong>null</strong> и <strong>undefined</strong></li>
</ul>`
      }
    },
    {
      title: 'Проверка знаний: основы JS',
      type: 'quiz',
      difficulty: 2,
      estimatedMinutes: 10,
      learningObjectives: ['Проверить понимание основ JavaScript'],
      content: {
        questions: [
          {
            question: 'Какой способ объявления переменной является современным и позволяет изменять значение?',
            options: ['var', 'let', 'const', 'def'],
            correct: 1,
            explanation: 'let — современный способ объявления изменяемой переменной в JS'
          },
          {
            question: 'В каком году был создан JavaScript?',
            options: ['1990', '1995', '2000', '2005'],
            correct: 1,
            explanation: 'JavaScript был создан Бренданом Эйхом в 1995 году'
          },
          {
            question: 'Какой тип данных хранит значения true/false?',
            options: ['Number', 'String', 'Boolean', 'Object'],
            correct: 2,
            explanation: 'Boolean хранит логические значения: true или false'
          },
          {
            question: 'Что такое Node.js?',
            options: [
              'Браузер',
              'Фреймворк для CSS',
              'Среда выполнения JavaScript на сервере',
              'База данных'
            ],
            correct: 2,
            explanation: 'Node.js позволяет запускать JavaScript на сервере вне браузера'
          }
        ]
      }
    },
    {
      title: 'Функции в JavaScript',
      type: 'text',
      difficulty: 2,
      estimatedMinutes: 20,
      learningObjectives: ['Научиться создавать функции', 'Понять стрелочные функции'],
      content: {
        body: `<h2>Функции</h2>
<p>Функция — это блок кода, который можно вызывать многократно.</p>
<pre><code>// Обычная функция
function greet(name) {
  return "Привет, " + name + "!";
}

// Стрелочная функция
const greet = (name) => "Привет, " + name + "!";

// Вызов
console.log(greet("Иван")); // Привет, Иван!</code></pre>
<h3>Параметры и возвращаемые значения</h3>
<p>Функции могут принимать параметры и возвращать значения с помощью <strong>return</strong>.</p>`
      }
    },
    {
      title: 'Массивы и объекты',
      type: 'quiz',
      difficulty: 3,
      estimatedMinutes: 15,
      learningObjectives: ['Работа с массивами', 'Работа с объектами'],
      content: {
        questions: [
          {
            question: 'Как получить длину массива arr?',
            options: ['arr.size', 'arr.length', 'arr.count', 'len(arr)'],
            correct: 1,
            explanation: 'Свойство .length возвращает количество элементов массива'
          },
          {
            question: 'Как добавить элемент в конец массива?',
            options: ['arr.add()', 'arr.append()', 'arr.push()', 'arr.insert()'],
            correct: 2,
            explanation: 'Метод push() добавляет элемент в конец массива'
          },
          {
            question: 'Как обратиться к свойству name объекта person?',
            options: ['person->name', 'person[name]', 'person.name', 'person::name'],
            correct: 2,
            explanation: 'Доступ к свойствам объекта через точку: объект.свойство'
          }
        ]
      }
    }
  ],

  'React: современная разработка': [
    {
      title: 'Что такое React?',
      type: 'text',
      difficulty: 2,
      estimatedMinutes: 12,
      learningObjectives: ['Понять концепцию React', 'Узнать о Virtual DOM'],
      content: {
        body: `<h2>React</h2>
<p>React — это JavaScript-библиотека для построения пользовательских интерфейсов, разработанная Facebook в 2013 году.</p>
<h3>Ключевые концепции</h3>
<ul>
<li><strong>Компоненты</strong> — строительные блоки UI</li>
<li><strong>Virtual DOM</strong> — эффективное обновление интерфейса</li>
<li><strong>JSX</strong> — синтаксис, похожий на HTML в JavaScript</li>
<li><strong>Props</strong> — данные передаваемые в компонент</li>
<li><strong>State</strong> — внутреннее состояние компонента</li>
</ul>
<h3>Пример компонента</h3>
<pre><code>function Hello({ name }) {
  return &lt;h1&gt;Привет, {name}!&lt;/h1&gt;;
}

// Использование
&lt;Hello name="Иван" /&gt;</code></pre>`
      }
    },
    {
      title: 'Хуки: useState и useEffect',
      type: 'text',
      difficulty: 3,
      estimatedMinutes: 25,
      learningObjectives: ['Использовать useState', 'Использовать useEffect'],
      content: {
        body: `<h2>React Hooks</h2>
<p>Хуки позволяют использовать состояние и другие функции React в функциональных компонентах.</p>
<h3>useState</h3>
<pre><code>import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    &lt;div&gt;
      &lt;p&gt;Счётчик: {count}&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;
        Увеличить
      &lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
<h3>useEffect</h3>
<pre><code>import { useEffect } from 'react';

function Component() {
  useEffect(() => {
    // Выполняется после рендера
    console.log('Компонент смонтирован');
    
    return () => {
      // Очистка при размонтировании
      console.log('Компонент удалён');
    };
  }, []); // [] = только при монтировании
}</code></pre>`
      }
    },
    {
      title: 'Тест по React',
      type: 'quiz',
      difficulty: 3,
      estimatedMinutes: 15,
      learningObjectives: ['Проверить знания React'],
      content: {
        questions: [
          {
            question: 'Какой хук используется для хранения состояния компонента?',
            options: ['useEffect', 'useState', 'useContext', 'useRef'],
            correct: 1,
            explanation: 'useState — основной хук для управления состоянием в функциональных компонентах'
          },
          {
            question: 'Что такое JSX?',
            options: [
              'Новый язык программирования',
              'База данных',
              'Синтаксическое расширение JavaScript для описания UI',
              'CSS-фреймворк'
            ],
            correct: 2,
            explanation: 'JSX позволяет писать HTML-подобный код внутри JavaScript'
          },
          {
            question: 'Когда выполняется useEffect с пустым массивом зависимостей []?',
            options: [
              'При каждом рендере',
              'Только при монтировании компонента',
              'Только при обновлении',
              'Никогда'
            ],
            correct: 1,
            explanation: 'Пустой массив [] означает что эффект выполнится один раз при монтировании'
          },
          {
            question: 'Как называются данные, передаваемые в компонент извне?',
            options: ['state', 'props', 'hooks', 'refs'],
            correct: 1,
            explanation: 'Props (properties) — данные которые родительский компонент передаёт дочернему'
          }
        ]
      }
    },
    {
      title: 'Управление состоянием с Redux',
      type: 'text',
      difficulty: 4,
      estimatedMinutes: 30,
      learningObjectives: ['Понять Redux', 'Использовать Redux Toolkit'],
      content: {
        body: `<h2>Redux Toolkit</h2>
<p>Redux — библиотека для управления глобальным состоянием приложения.</p>
<h3>Основные концепции</h3>
<ul>
<li><strong>Store</strong> — единое хранилище состояния</li>
<li><strong>Action</strong> — объект описывающий что произошло</li>
<li><strong>Reducer</strong> — функция изменяющая состояние</li>
<li><strong>Selector</strong> — функция для чтения состояния</li>
</ul>
<h3>Пример с Redux Toolkit</h3>
<pre><code>import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value += 1 },
    decrement: state => { state.value -= 1 }
  }
});

export const { increment, decrement } = counterSlice.actions;
export default counterSlice.reducer;</code></pre>`
      }
    }
  ],

  'MongoDB и Node.js': [
    {
      title: 'Введение в MongoDB',
      type: 'text',
      difficulty: 2,
      estimatedMinutes: 15,
      learningObjectives: ['Понять NoSQL базы данных', 'Освоить основы MongoDB'],
      content: {
        body: `<h2>MongoDB</h2>
<p>MongoDB — документо-ориентированная NoSQL база данных. Данные хранятся в JSON-подобных документах.</p>
<h3>Основные понятия</h3>
<ul>
<li><strong>Database</strong> — база данных</li>
<li><strong>Collection</strong> — коллекция (аналог таблицы в SQL)</li>
<li><strong>Document</strong> — документ (аналог строки в SQL)</li>
<li><strong>Field</strong> — поле документа</li>
</ul>
<h3>Пример документа</h3>
<pre><code>{
  "_id": ObjectId("..."),
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "age": 25,
  "courses": ["JavaScript", "React"]
}</code></pre>
<h3>Преимущества MongoDB</h3>
<ul>
<li>Гибкая схема данных</li>
<li>Горизонтальное масштабирование</li>
<li>Высокая производительность</li>
<li>Нативная поддержка JSON</li>
</ul>`
      }
    },
    {
      title: 'CRUD операции в MongoDB',
      type: 'text',
      difficulty: 3,
      estimatedMinutes: 20,
      learningObjectives: ['Создавать документы', 'Читать, обновлять и удалять документы'],
      content: {
        body: `<h2>CRUD в MongoDB</h2>
<h3>Create — создание</h3>
<pre><code>// Вставка одного документа
db.users.insertOne({ name: "Иван", age: 25 });

// Вставка нескольких
db.users.insertMany([
  { name: "Мария", age: 30 },
  { name: "Пётр", age: 22 }
]);</code></pre>
<h3>Read — чтение</h3>
<pre><code>// Все документы
db.users.find();

// С фильтром
db.users.find({ age: { $gt: 24 } });

// Один документ
db.users.findOne({ name: "Иван" });</code></pre>
<h3>Update — обновление</h3>
<pre><code>db.users.updateOne(
  { name: "Иван" },
  { $set: { age: 26 } }
);</code></pre>
<h3>Delete — удаление</h3>
<pre><code>db.users.deleteOne({ name: "Иван" });</code></pre>`
      }
    },
    {
      title: 'Тест по MongoDB',
      type: 'quiz',
      difficulty: 3,
      estimatedMinutes: 10,
      learningObjectives: ['Проверить знания MongoDB'],
      content: {
        questions: [
          {
            question: 'Как называется аналог таблицы в MongoDB?',
            options: ['Table', 'Collection', 'Document', 'Schema'],
            correct: 1,
            explanation: 'В MongoDB данные хранятся в коллекциях (Collections)'
          },
          {
            question: 'Какой метод используется для поиска одного документа?',
            options: ['find()', 'findOne()', 'search()', 'get()'],
            correct: 1,
            explanation: 'findOne() возвращает первый документ, соответствующий фильтру'
          },
          {
            question: 'Какой оператор используется для условия "больше чем"?',
            options: ['$greater', '$gt', '$more', '$above'],
            correct: 1,
            explanation: '$gt (greater than) — оператор сравнения "больше чем"'
          }
        ]
      }
    },
    {
      title: 'Mongoose — ODM для Node.js',
      type: 'text',
      difficulty: 3,
      estimatedMinutes: 25,
      learningObjectives: ['Использовать Mongoose', 'Создавать схемы и модели'],
      content: {
        body: `<h2>Mongoose</h2>
<p>Mongoose — это ODM (Object Document Mapper) для MongoDB и Node.js. Он добавляет схемы и валидацию.</p>
<h3>Подключение</h3>
<pre><code>const mongoose = require('mongoose');
await mongoose.connect('mongodb://localhost/mydb');</code></pre>
<h3>Создание схемы</h3>
<pre><code>const userSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  email: { type: String, unique: true },
  age:   { type: Number, min: 0, max: 120 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);</code></pre>
<h3>Использование модели</h3>
<pre><code>// Создание
const user = await User.create({ name: 'Иван', email: 'ivan@mail.ru' });

// Поиск
const users = await User.find({ age: { $gt: 18 } });

// Обновление
await User.findByIdAndUpdate(id, { name: 'Новое имя' });</code></pre>`
      }
    }
  ],

  'Machine Learning на Python': [
    {
      title: 'Введение в Machine Learning',
      type: 'text',
      difficulty: 3,
      estimatedMinutes: 20,
      learningObjectives: ['Понять что такое ML', 'Узнать виды обучения'],
      content: {
        body: `<h2>Machine Learning</h2>
<p>Машинное обучение — раздел искусственного интеллекта, изучающий алгоритмы, которые улучшаются автоматически через опыт.</p>
<h3>Виды машинного обучения</h3>
<ul>
<li><strong>Обучение с учителем</strong> — модель учится на размеченных данных (классификация, регрессия)</li>
<li><strong>Обучение без учителя</strong> — модель ищет паттерны без меток (кластеризация)</li>
<li><strong>Обучение с подкреплением</strong> — агент учится взаимодействуя со средой</li>
</ul>
<h3>Основные понятия</h3>
<ul>
<li><strong>Датасет</strong> — набор обучающих данных</li>
<li><strong>Признаки (features)</strong> — входные переменные</li>
<li><strong>Метка (label)</strong> — целевая переменная</li>
<li><strong>Модель</strong> — алгоритм, обученный на данных</li>
</ul>`
      }
    },
    {
      title: 'Библиотека scikit-learn',
      type: 'text',
      difficulty: 3,
      estimatedMinutes: 30,
      learningObjectives: ['Использовать scikit-learn', 'Обучить первую модель'],
      content: {
        body: `<h2>scikit-learn</h2>
<p>scikit-learn — популярная библиотека Machine Learning для Python.</p>
<h3>Установка</h3>
<pre><code>pip install scikit-learn pandas numpy</code></pre>
<h3>Пример: классификация</h3>
<pre><code>from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Загрузка данных
X, y = load_iris(return_X_y=True)

# Разделение на train/test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Обучение модели
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Оценка
y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")</code></pre>`
      }
    },
    {
      title: 'Тест по Machine Learning',
      type: 'quiz',
      difficulty: 4,
      estimatedMinutes: 12,
      learningObjectives: ['Проверить знания ML'],
      content: {
        questions: [
          {
            question: 'Какой вид обучения используется когда данные размечены?',
            options: [
              'Обучение без учителя',
              'Обучение с учителем',
              'Обучение с подкреплением',
              'Полуобучение'
            ],
            correct: 1,
            explanation: 'Обучение с учителем использует размеченные данные с известными ответами'
          },
          {
            question: 'Что такое overfitting (переобучение)?',
            options: [
              'Модель плохо учится на тренировочных данных',
              'Модель отлично работает на тренировочных, но плохо на новых данных',
              'Модель слишком медленно обучается',
              'Данных слишком много'
            ],
            correct: 1,
            explanation: 'Переобучение — модель "запомнила" обучающие данные, но не обобщает на новые'
          },
          {
            question: 'Какая метрика используется для задачи классификации?',
            options: ['MSE', 'RMSE', 'Accuracy', 'R²'],
            correct: 2,
            explanation: 'Accuracy (точность) — доля правильно классифицированных объектов'
          }
        ]
      }
    }
  ]
};

const coursesData = [
  {
    title: 'JavaScript для начинающих',
    description: 'Полный курс по JavaScript с нуля. Изучите основы языка, работу с DOM, асинхронное программирование и современный синтаксис ES6+.',
    category: 'programming',
    level: 'beginner',
    tags: ['javascript', 'web', 'frontend', 'programming'],
    isPublished: true
  },
  {
    title: 'React: современная разработка',
    description: 'Научитесь создавать современные веб-приложения с React. Хуки, Redux, работа с API и лучшие практики разработки.',
    category: 'programming',
    level: 'intermediate',
    tags: ['react', 'javascript', 'frontend', 'redux'],
    isPublished: true
  },
  {
    title: 'MongoDB и Node.js',
    description: 'Создание серверных приложений с Node.js и MongoDB. REST API, Mongoose, аутентификация и деплой.',
    category: 'programming',
    level: 'intermediate',
    tags: ['nodejs', 'mongodb', 'backend', 'api'],
    isPublished: true
  },
  {
    title: 'Machine Learning на Python',
    description: 'Введение в машинное обучение с использованием Python, scikit-learn и pandas. От теории к практике.',
    category: 'data-science',
    level: 'advanced',
    tags: ['python', 'ml', 'data-science', 'scikit-learn'],
    isPublished: true
  }
];

// ══════════════════════════════════════════════════════════════
// SEED FUNCTION
// ══════════════════════════════════════════════════════════════
const seed = async () => {
  await connectDB();

  console.log('🧹 Clearing existing data...');
  await User.deleteMany({});
  await Course.deleteMany({});
  await Module.deleteMany({});

  // ─── Create users ─────────────────────────────────────────
  console.log('👤 Creating users...');
  const createdUsers = [];
  for (const u of users) {
    const user = await User.create({
      email:       u.email,
      passwordHash: u.password,
      role:        u.role,
      profile:     u.profile
    });
    createdUsers.push(user);
    console.log(`   ✅ ${u.role}: ${u.email} / ${u.password}`);
  }

  const instructor = createdUsers.find(u => u.role === 'instructor');

  // ─── Create courses and modules ────────────────────────────
console.log('📚 Creating courses and modules...');
for (const courseData of coursesData) {
  const modulesData = courseModules[courseData.title] || [];

  // Сначала создаём курс без модулей
  const course = await Course.create({
    ...courseData,
    instructorId: instructor._id,
    modules: []
  });

  // Затем создаём модули с правильным courseId
  const createdModules = [];
  for (const modData of modulesData) {
    const mod = await Module.create({
      courseId:           course._id,
      title:              modData.title,
      type:               modData.type,
      difficulty:         modData.difficulty,
      estimatedMinutes:   modData.estimatedMinutes,
      learningObjectives: modData.learningObjectives,
      content:            modData.content
    });
    createdModules.push(mod);
  }

  // Обновляем курс добавляя модули
  await Course.findByIdAndUpdate(course._id, {
    modules: createdModules.map((m, idx) => ({ moduleId: m._id, order: idx + 1 }))
  });

  console.log(`   ✅ "${course.title}" — ${createdModules.length} modules`);
}

  console.log('\n🎉 Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test accounts:');
  console.log('  Student:    student@adaptlearn.ru / student123');
  console.log('  Instructor: instructor@adaptlearn.ru / instructor123');
  console.log('  Admin:      admin@adaptlearn.ru / admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
