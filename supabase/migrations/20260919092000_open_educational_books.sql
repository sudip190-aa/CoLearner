-- Pinned MIT-licensed educational reading guides. Source manifests and complete notices are in data/books/.
do $seed$ declare b bigint;begin
if not exists(select 1 from public.books where slug='javascript-foundations') then
insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values('javascript-foundations','JavaScript Foundations','Microsoft and curriculum contributors','A chapter-based reading guide adapted from the openly licensed Web-Dev-For-Beginners curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.','Programming','English','https://github.com/microsoft/Web-Dev-For-Beginners/tree/78085398be0dea7abaaf5eda914817f46f6ddbbc','MIT','https://github.com/microsoft/Web-Dev-For-Beginners/blob/78085398be0dea7abaaf5eda914817f46f6ddbbc/LICENSE','    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
','Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained. This is a reading adaptation, not a complete standalone edition.','https://github.com/microsoft/Web-Dev-For-Beginners/blob/78085398be0dea7abaaf5eda914817f46f6ddbbc/LICENSE','Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.',true,true,70) returning id into b;
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'javascript-foundations-1','JavaScript Basics: Data Types',1,'# JavaScript Basics: Data Types


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

```mermaid
journey
    title Your JavaScript Data Types Adventure
    section Foundation
      Variables & Constants: 5: You
      Declaration Syntax: 4: You
      Assignment Concepts: 5: You
    section Core Types
      Numbers & Math: 4: You
      Strings & Text: 5: You
      Booleans & Logic: 4: You
    section Apply Knowledge
      Type Conversion: 4: You
      Real-world Examples: 5: You
      Best Practices: 5: You
```

Data types are one of the fundamental concepts in JavaScript that you''ll encounter in every program you write. Think of data types like the filing system used by ancient librarians in Alexandria – they had specific places for scrolls containing poetry, mathematics, and historical records. JavaScript organizes information in a similar way with different categories for different kinds of data.

In this lesson, we''ll explore the core data types that make JavaScript work. You''ll learn how to handle numbers, text, true/false values, and understand why choosing the correct type is essential for your programs. These concepts might seem abstract at first, but with practice, they''ll become second nature.

Understanding data types will make everything else in JavaScript much clearer. Just as architects need to understand different building materials before constructing a cathedral, these fundamentals will support everything you build going forward.

## Pre-Lecture Quiz
Pre-lecture quiz (https://ff-quizzes.netlify.app/web/)

This lesson covers the basics of JavaScript, the language that provides interactivity on the web.

> You can take this lesson on Microsoft Learn (https://docs.microsoft.com/learn/modules/web-development-101-variables/?WT.mc_id=academic-77807-sagibbon)!

[](https://youtube.com/watch?v=JNIXfGiDWM8 "Variables in JavaScript")

[](https://youtube.com/watch?v=AWfA95eLdq8 "Data Types in JavaScript")

> 🎥 Click the images above for videos about variables and data types

Let''s start with variables and the data types that populate them!

```mermaid
mindmap
  root((JavaScript Data))
    Variables
      let myVar
      const PI = 3.14
      var oldStyle
    Primitive Types
      number
        42
        3.14
        -5
      string
        "Hello"
        ''World''
        `Template`
      boolean
        true
        false
      undefined
      null
    Operations
      Arithmetic
        + - * / %
      String Methods
        concatenation
        template literals
      Type Conversion
        implicit
        explicit
```

## Variables

Variables are fundamental building blocks in programming. Like the labeled jars that medieval alchemists used to store different substances, variables let you store information and give it a descriptive name so you can reference it later. Need to remember someone''s age? Store it in a variable called `age`. Want to track a user''s name? Keep it in a variable called `userName`.

We''ll focus on the modern approach to creating variables in JavaScript. The techniques you''ll learn here represent years of language evolution and best practices developed by the programming community.

Creating and **declaring** a variable has the following syntax **[keyword] [name]**. It''s made up of the two parts:

- **Keyword**. Use `let` for variables that can change, or `const` for values that stay the same.
- **The variable name**, this is a descriptive name you choose yourself.

✅ The keyword `let` was introduced in ES6 and gives your variable a so called _block scope_. It''s recommended that you use `let` or `const` instead of the older `var` keyword. We will cover block scopes more in depth in future parts.

### Task - working with variables

1. **Declare a variable**. Let''s start by creating our first variable:

    ```javascript
    let myVariable;
    ```

   **What this accomplishes:**
   - This tells JavaScript to create a storage location called `myVariable`
   - JavaScript allocates space in memory for this variable
   - The variable currently has no value (undefined)

2. **Give it a value**. Now let''s put something in our variable:

    ```javascript
    myVariable = 123;
    ```

   **How assignment works:**
   - The `=` operator assigns the value 123 to our variable
   - The variable now contains this value instead of being undefined
   - You can reference this value throughout your code using `myVariable`

   > Note: the use of `=` in this lesson means we make use of an "assignment operator", used to set a value to a variable. It doesn''t denote equality.

3. **Do it the smart way**. Actually, let''s combine those two steps:

    ```javascript
    let myVariable = 123;
    ```

    **This approach is more efficient:**
    - You''re declaring the variable and assigning a value in one statement
    - This is the standard practice among developers
    - It reduces code length while maintaining clarity

4. **Change your mind**. What if we want to store a different number?

   ```javascript
   myVariable = 321;
   ```

   **Understanding reassignment:**
   - The variable now contains 321 instead of 123
   - The previous value is replaced – variables store only one value at a time
   - This mutability is the key characteristic of variables declared with `let`

   ✅ Try it! You can write JavaScript right in your browser. Open a browser window and navigate to Developer Tools. In the console, you will find a prompt; type `let myVariable = 123`, press return, then type `myVariable`. What happens? Note, you''ll learn more about these concepts in subsequent lessons.

### 🧠 **Variables Mastery Check: Getting Comfortable**

**Let''s see how you''re feeling about variables:**
- Can you explain the difference between declaring and assigning a variable?
- What happens if you try to use a variable before you declare it?
- When would you choose `let` over `const` for a variable?

```mermaid
stateDiagram-v2
    [*] --> Declared: let myVar
    Declared --> Assigned: myVar = 123
    Assigned --> Reassigned: myVar = 456
    Assigned --> [*]: Variable ready!
    Reassigned --> [*]: Updated value
    
    note right of Declared
        Variable exists but
        has no value (undefined)
    end note
    
    note right of Assigned
        Variable contains
        the value 123
    end note
```

> **Quick tip**: Think of variables as labeled storage boxes. You create the box (`let`), put something in it (`=`), and can later replace the contents if needed!

## Constants

Sometimes you need to store information that should never change during program execution. Think of constants like the mathematical principles that Euclid established in ancient Greece – once proven and documented, they remained fixed for all future reference.

Constants work similarly to variables, but with an important restriction: once you assign their value, it cannot be changed. This immutability helps prevent accidental modifications to critical values in your program.

Declaration and initialization of a constant follows the same concepts as a variable, with the exception of the `const` keyword. Constants are typically declared with all uppercase letters.

```javascript
const MY_VARIABLE = 123;
```

**Here''s what this code does:**
- **Creates** a constant named `MY_VARIABLE` with the value 123
- **Uses** uppercase naming convention for constants
- **Prevents** any future changes to this value

Constants have two main rules:

- **You must give them a value right away** – no empty constants allowed!
- **You can never change that value** – JavaScript will throw an error if you try. Let''s see what I mean:

   **Simple value** - The following is NOT allowed:
   
      ```javascript
      const PI = 3;
      PI = 4; // not allowed
      ```

   **What you need to remember:**
   - **Attempts** to reassign a constant will cause an error
   - **Protects** important values from accidental changes
   - **Ensures** the value remains consistent throughout your program
 
   **Object reference is protected** - The following is NOT allowed:
   
      ```javascript
      const obj = { a: 3 };
      obj = { b: 5 } // not allowed
      ```

   **Understanding these concepts:**
   - **Prevents** replacing the entire object with a new one
   - **Protects** the reference to the original object
   - **Maintains** the object''s identity in memory

    **Object value is not protected** - The following IS allowed:
    
      ```javascript
      const obj = { a: 3 };
      obj.a = 5;  // allowed
      ```

      **Breaking down what happens here:**
      - **Modifies** the property value inside the object
      - **Keeps** the same object reference
      - **Demonstrates** that object contents can change while the reference stays constant

   > Note, a `const` means the reference is protected from reassignment. The value is not _immutable_ though and can change, especially if it''s a complex construct like an object.

## Data Types

JavaScript organizes information into different categories called data types. This concept mirrors how ancient scholars categorized knowledge – Aristotle distinguished between different types of reasoning, knowing that logical principles couldn''t be applied uniformly to poetry, mathematics, and natural philosophy.

Data types matter because different operations work with different kinds of information. Just as you can''t perform arithmetic on a person''s name or alphabetize a mathematical equation, JavaScript requires the appropriate data type for each operation. Understanding this prevents errors and makes your code more reliable.

Variables can store many different types of values, like numbers and text. These various types of values are known as the **data type**. Data types are an important part of software development because it helps developers make decisions on how the code should be written and how the software should run. Furthermore, some data types have unique features that help transform or extract additional information in a value.

✅ Data Types are also referred to as JavaScript data primitives, as they are the lowest-level data types that are provided by the language. There are 7 primitive data types: string, number, bigint, boolean, undefined, null and symbol. Take a minute to visualize what each of these primitives might represent. What is a `zebra`? How about `0`? `true`?

### Numbers

Numbers are the most straightforward data type in JavaScript. Whether you''re working with whole numbers like 42, decimals like 3.14, or negative numbers like -5, JavaScript handles them uniformly.

Remember our variable from earlier? That 123 we stored was actually a number data type:

```javascript
let myVariable = 123;
```

**Key characteristics:**
- JavaScript automatically recognizes numeric values
- You can perform mathematical operations with these variables
- No explicit type declaration is required

Variables can store all types of numbers, including decimals or negative numbers. Numbers also can be used with arithmetic operators, covered in the next section (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/2-js-basics/1-data-types/README.md#arithmetic-operators).

```mermaid
flowchart LR
    A["🔢 Numbers"] --> B["➕ Addition"]
    A --> C["➖ Subtraction"]
    A --> D["✖️ Multiplication"]
    A --> E["➗ Division"]
    A --> F["📊 Remainder %"]
    
    B --> B1["1 + 2 = 3"]
    C --> C1["5 - 3 = 2"]
    D --> D1["4 * 3 = 12"]
    E --> E1["10 / 2 = 5"]
    F --> F1["7 % 3 = 1"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
    style F fill:#fce4ec
```

### Arithmetic Operators

Arithmetic operators allow you to perform mathematical calculations in JavaScript. These operators follow the same principles mathematicians have used for centuries – the same symbols that appeared in the works of scholars like Al-Khwarizmi, who developed algebraic notation.

The operators work as you would expect from traditional mathematics: plus for addition, minus for subtraction, and so forth.

There are several types of operators to use when performing arithmetic functions, and some are listed here:

| Symbol | Description                                                              | Example                          |
| ------ | ------------------------------------------------------------------------ | -------------------------------- |
| `+`    | **Addition**: Calculates the sum of two numbers                          | `1 + 2 //expected answer is 3`   |
| `-`    | **Subtraction**: Calculates the difference of two numbers                | `1 - 2 //expected answer is -1`  |
| `*`    | **Multiplication**: Calculates the product of two numbers                | `1 * 2 //expected answer is 2`   |
| `/`    | **Division**: Calculates the quotient of two numbers                     | `1 / 2 //expected answer is 0.5` |
| `%`    | **Remainder**: Calculates the remainder from the division of two numbers | `1 % 2 //expected answer is 1`   |

✅ Try it! Try an arithmetic operation in your browser''s console. Do the results surprise you?

### 🧮 **Math Skills Check: Calculating with Confidence**

**Test your arithmetic understanding:**
- What''s the difference between `/` (division) and `%` (remainder)?
- Can you predict what `10 % 3` equals? (Hint: it''s not 3.33...)
- Why might the remainder operator be useful in programming?

```mermaid
pie title "JavaScript Number Operations Usage"
    "Addition (+)" : 35
    "Subtraction (-)" : 20
    "Multiplication (*)" : 20
    "Division (/)" : 15
    "Remainder (%)" : 10
```

> **Real-world insight**: The remainder operator (%) is super useful for checking if numbers are even/odd, creating patterns, or cycling through arrays!

### Strings

In JavaScript, textual data is represented as strings. The term "string" comes from the concept of characters strung together in sequence, much like the way scribes in medieval monasteries would connect letters to form words and sentences in their manuscripts.

Strings are fundamental to web development. Every piece of text displayed on a website – usernames, button labels, error messages, content – is handled as string data. Understanding strings is essential for creating functional user interfaces.

Strings are sets of characters that reside between single or double quotes.

```javascript
''This is a string''
"This is also a string"
let myString = ''This is a string value stored in a variable'';
```

**Understanding these concepts:**
- **Uses** either single quotes `''` or double quotes `"` to define strings
- **Stores** text data that can include letters, numbers, and symbols
- **Assigns** string values to variables for later use
- **Requires** quotes to distinguish text from variable names

Remember to use quotes when writing a string, or else JavaScript will assume it''s a variable name.

```mermaid
flowchart TD
    A["📝 Strings"] --> B["Single Quotes"]
    A --> C["Double Quotes"]
    A --> D["Template Literals"]
    
    B --> B1["''Hello World''"]
    C --> C1["\"Hello World\""]
    D --> D1["`Hello \${name}`"]
    
    E["String Operations"] --> F["Concatenation"]
    E --> G["Template Insertion"]
    E --> H["Length & Methods"]
    
    F --> F1["''Hello'' + '' '' + ''World''"]
    G --> G1["`Hello \${firstName} \${lastName}`"]
    H --> H1["myString.length"]
    
    style A fill:#e3f2fd
    style E fill:#fff3e0
    style D fill:#e8f5e8
    style G fill:#e8f5e8
```

### Formatting Strings

String manipulation allows you to combine text elements, incorporate variables, and create dynamic content that responds to program state. This technique enables you to construct text programmatically.

Often you need to join multiple strings together – this process is called concatenation.

To **concatenate** two or more strings, or join them together, use the `+` operator.

```javascript
let myString1 = "Hello";
let myString2 = "World";

myString1 + myString2 + "!"; //HelloWorld!
myString1 + " " + myString2 + "!"; //Hello World!
myString1 + ", " + myString2 + "!"; //Hello, World!
```

**Step by step, here''s what''s happening:**
- **Combines** multiple strings using the `+` operator
- **Joins** strings directly together without spaces in the first example
- **Adds** space characters `" "` between strings for readability
- **Inserts** punctuation like commas to create proper formatting

✅ Why does `1 + 1 = 2` in JavaScript, but `''1'' + ''1'' = 11?` Think about it. What about `''1'' + 1`?

**Template literals** are another way to format strings, except instead of quotes, the backtick  is used. Anything that is not plain text must be placed inside placeholders `${ }`. This includes any variables that may be strings.

```javascript
let myString1 = "Hello";
let myString2 = "World";

`${myString1} ${myString2}!` //Hello World!
`${myString1}, ${myString2}!` //Hello, World!
```

**Let''s understand each part:**
- **Uses** backticks `` ` `` instead of regular quotes to create template literals
- **Embeds** variables directly using `${}` placeholder syntax
- **Preserves** spaces and formatting exactly as written
- **Provides** a cleaner way to create complex strings with variables

You can achieve your formatting goals with either method, but template literals will respect any spaces and line breaks.

✅ When would you use a template literal vs. a plain string?

### 🔤 **String Mastery Check: Text Manipulation Confidence**

**Evaluate your string skills:**
- Can you explain why `''1'' + ''1''` equals `''11''` instead of `2`?
- Which string method do you find more readable: concatenation or template literals?
- What happens if you forget the quotes around a string?

```mermaid
stateDiagram-v2
    [*] --> PlainText: "Hello"
    [*] --> Variable: name = "Alice"
    PlainText --> Concatenated: + " " + name
    Variable --> Concatenated
    PlainText --> Template: `Hello ${name}`
    Variable --> Template
    Concatenated --> Result: "Hello Alice"
    Template --> Result
    
    note right of Concatenated
        Traditional method
        More verbose
    end note
    
    note right of Template
        Modern ES6 syntax
        Cleaner & more readable
    end note
```

> **Pro tip**: Template literals are generally preferred for complex string building because they''re more readable and handle multi-line strings beautifully!

### Booleans

Booleans represent the simplest form of data: they can only hold one of two values – `true` or `false`. This binary logic system traces back to the work of George Boole, a 19th-century mathematician who developed Boolean algebra.

Despite their simplicity, booleans are essential for program logic. They enable your code to make decisions based on conditions – whether a user is logged in, if a button was clicked, or if certain criteria are met.

Booleans can be only two values: `true` or `false`. Booleans can help make decisions on which lines of code should run when certain conditions are met. In many cases, operators (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/2-js-basics/1-data-types/README.md#arithmetic-operators) assist with setting the value of a Boolean and you will often notice and write variables being initialized or their values being updated with an operator.

```javascript
let myTrueBool = true;
let myFalseBool = false;
```

**In the above, we''ve:**
- **Created** a variable that stores the Boolean value `true`
- **Demonstrated** how to store the Boolean value `false`
- **Used** the exact keywords `true` and `false` (no quotes needed)
- **Prepared** these variables for use in conditional statements

✅ A variable can be considered ''truthy'' if it evaluates to a boolean `true`. Interestingly, in JavaScript, all values are truthy unless defined as falsy (https://developer.mozilla.org/docs/Glossary/Truthy).

```mermaid
flowchart LR
    A["🔘 Boolean Values"] --> B["true"]
    A --> C["false"]
    
    D["Truthy Values"] --> D1["''hello''"]
    D --> D2["42"]
    D --> D3["[]"]
    D --> D4["{}"]
    
    E["Falsy Values"] --> E1["false"]
    E --> E2["0"]
    E --> E3["''''"]
    E --> E4["null"]
    E --> E5["undefined"]
    E --> E6["NaN"]
    
    style B fill:#e8f5e8
    style C fill:#ffebee
    style D fill:#e3f2fd
    style E fill:#fff3e0
```

### 🎯 **Boolean Logic Check: Decision Making Skills**

**Test your boolean understanding:**
- Why do you think JavaScript has "truthy" and "falsy" values beyond just `true` and `false`?
- Can you predict which of these is falsy: `0`, `"0"`, `[]`, `"false"`?
- How might booleans be useful in controlling program flow?

```mermaid
pie title "Common Boolean Use Cases"
    "Conditional Logic" : 40
    "User State" : 25
    "Feature Toggles" : 20
    "Validation" : 15
```

> **Remember**: In JavaScript, only 6 values are falsy: `false`, `0`, `""`, `null`, `undefined`, and `NaN`. Everything else is truthy!

---

## 📊 **Your Data Types Toolkit Summary**

```mermaid
graph TD
    A["🎯 JavaScript Data Types"] --> B["📦 Variables"]
    A --> C["🔢 Numbers"]
    A --> D["📝 Strings"]
    A --> E["🔘 Booleans"]
    
    B --> B1["let mutable"]
    B --> B2["const immutable"]
    
    C --> C1["42, 3.14, -5"]
    C --> C2["+ - * / %"]
    
    D --> D1["''quotes'' or \\\"quotes\\\""]
    D --> D2["`template literals`"]
    
    E --> E1["true or false"]
    E --> E2["truthy vs falsy"]
    
    F["⚡ Key Concepts"] --> F1["Type matters for operations"]
    F --> F2["JavaScript is dynamically typed"]
    F --> F3["Variables can change types"]
    F --> F4["Naming is case-sensitive"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
    style F fill:#fce4ec
```

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Create a personal information manager that demonstrates all the JavaScript data types you''ve learned in this lesson while handling real-world data scenarios.

**Prompt:** Build a JavaScript program that creates a user profile object containing: a person''s name (string), age (number), is a student status (boolean), favorite colors as an array, and an address object with street, city, and zip code properties. Include functions to display the profile information and update individual fields. Make sure to demonstrate string concatenation, template literals, arithmetic operations with the age, and boolean logic for the student status.

Learn more about agent mode (https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) here.

## 🚀 Challenge

JavaScript has some behaviors that can catch developers off guard. Here''s a classic example to explore: try typing this in your browser console: `let age = 1; let Age = 2; age == Age` and observe the result. It returns `false` – can you determine why?

This represents one of many JavaScript behaviors worth understanding. Familiarity with these quirks will help you write more reliable code and debug issues more effectively.

## Post-Lecture Quiz
Post-lecture quiz (https://ff-quizzes.netlify.app/)

## Review & Self Study

Take a look at this list of JavaScript exercises (https://css-tricks.com/snippets/javascript/) and try one. What did you learn?

## Assignment

Data Types Practice (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/2-js-basics/1-data-types/assignment.md)

## 🚀 Your JavaScript Data Types Mastery Timeline

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Open your browser console and create 3 variables with different data types
- [ ] Try the challenge: `let age = 1; let Age = 2; age == Age` and figure out why it''s false
- [ ] Practice string concatenation with your name and favorite number
- [ ] Test what happens when you add a number to a string

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and review any confusing concepts
- [ ] Create a mini calculator that adds, subtracts, multiplies, and divides two numbers
- [ ] Build a simple name formatter using template literals
- [ ] Explore the differences between `==` and `===` comparison operators
- [ ] Practice converting between different data types

### 📅 **Your Week-Long JavaScript Foundation**
- [ ] Complete the assignment with confidence and creativity
- [ ] Create a personal profile object using all data types learned
- [ ] Practice with JavaScript exercises from CSS-Tricks (https://css-tricks.com/snippets/javascript/)
- [ ] Build a simple form validator using boolean logic
- [ ] Experiment with array and object data types (preview of coming lessons)
- [ ] Join a JavaScript community and ask questions about data types

### 🌟 **Your Month-Long Transformation**
- [ ] Integrate data type knowledge into larger programming projects
- [ ] Understand when and why to use each data type in real applications
- [ ] Help other beginners understand JavaScript fundamentals
- [ ] Build a small application that manages different types of user data
- [ ] Explore advanced data type concepts like type coercion and strict equality
- [ ] Contribute to open source JavaScript projects with documentation improvements

### 🧠 **Final Data Types Mastery Check-in**

**Celebrate your JavaScript foundation:**
- Which data type surprised you the most in terms of its behavior?
- How comfortable do you feel explaining variables vs. constants to a friend?
- What''s the most interesting thing you discovered about JavaScript''s type system?
- Which real-world application can you imagine building with these fundamentals?

```mermaid
journey
    title Your JavaScript Confidence Journey
    section Today
      Confused: 3: You
      Curious: 4: You
      Excited: 5: You
    section This Week
      Practicing: 4: You
      Understanding: 5: You
      Building: 5: You
    section Next Month
      Problem Solving: 5: You
      Teaching Others: 5: You
      Real Projects: 5: You
```

> 💡 **You''ve built the foundation!** Understanding data types is like learning the alphabet before writing stories. Every JavaScript program you''ll ever write will use these fundamental concepts. You now have the building blocks to create interactive websites, dynamic applications, and solve real-world problems with code. Welcome to the wonderful world of JavaScript! 🎉',20);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'javascript-foundations-2','JavaScript Basics: Methods and Functions',2,'# JavaScript Basics: Methods and Functions


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

```mermaid
journey
    title Your JavaScript Functions Adventure
    section Foundation
      Function Syntax: 5: You
      Calling Functions: 4: You
      Parameters & Arguments: 5: You
    section Advanced Concepts
      Return Values: 4: You
      Default Parameters: 5: You
      Function Composition: 4: You
    section Modern JavaScript
      Arrow Functions: 5: You
      Anonymous Functions: 4: You
      Higher-Order Functions: 5: You
```

## Pre-Lecture Quiz
Pre-lecture quiz (https://ff-quizzes.netlify.app/)

Writing the same code repeatedly is one of programming''s most common frustrations. Functions solve this problem by letting you package code into reusable blocks. Think of functions like the standardized parts that made Henry Ford''s assembly line revolutionary – once you create a reliable component, you can use it wherever needed without rebuilding from scratch.

Functions allow you to bundle pieces of code so you can reuse them throughout your program. Instead of copying and pasting the same logic everywhere, you can create a function once and call it whenever needed. This approach keeps your code organized and makes updates much easier.

In this lesson, you''ll learn how to create your own functions, pass information to them, and get useful results back. You''ll discover the difference between functions and methods, learn modern syntax approaches, and see how functions can work with other functions. We''ll build these concepts step by step.

[](https://youtube.com/watch?v=XgKsD6Zwvlc "Methods and Functions")

> 🎥 Click the image above for a video about methods and functions.

> You can take this lesson on Microsoft Learn (https://docs.microsoft.com/learn/modules/web-development-101-functions/?WT.mc_id=academic-77807-sagibbon)!

```mermaid
mindmap
  root((JavaScript Functions))
    Basic Concepts
      Declaration
        Traditional syntax
        Arrow function syntax
      Calling
        Using parentheses
        Parentheses required
    Parameters
      Input Values
        Multiple parameters
        Default values
      Arguments
        Values passed in
        Can be any type
    Return Values
      Output Data
        return statement
        Exit function
      Use Results
        Store in variables
        Chain functions
    Advanced Patterns
      Higher-Order
        Functions as parameters
        Callbacks
      Anonymous
        No name needed
        Inline definition
```

## Functions

A function is a self-contained block of code that performs a specific task. It encapsulates logic that you can execute whenever needed.

Instead of writing the same code multiple times throughout your program, you can package it in a function and call that function whenever you need it. This approach keeps your code clean and makes updates much easier. Consider the maintenance challenge if you needed to change logic that was scattered across 20 different locations in your codebase.

Naming your functions descriptively is essential. A well-named function communicates its purpose clearly – when you see `cancelTimer()`, you immediately understand what it does, just as a clearly labeled button tells you exactly what will happen when you click it. 

## Creating and calling a function

Let''s examine how to create a function. The syntax follows a consistent pattern:

```javascript
function nameOfFunction() { // function definition
 // function definition/body
}
```

Let''s break this down:
- The `function` keyword tells JavaScript "Hey, I''m creating a function!"
- `nameOfFunction` is where you give your function a descriptive name
- The parentheses `()` are where you can add parameters (we''ll get to that soon)
- The curly braces `{}` contain the actual code that runs when you call the function

Let''s create a simple greeting function to see this in action:

```javascript
function displayGreeting() {
  console.log(''Hello, world!'');
}
```

This function prints "Hello, world!" to the console. Once you''ve defined it, you can use it as many times as needed.

To execute (or "call") your function, write its name followed by parentheses. JavaScript allows you to define your function before or after you call it – the JavaScript engine will handle the execution order.

```javascript
// calling our function
displayGreeting();
```

When you run this line, it executes all the code inside your `displayGreeting` function, displaying "Hello, world!" in your browser''s console. You can call this function repeatedly.

### 🧠 **Function Fundamentals Check: Building Your First Functions**

**Let''s see how you''re feeling about basic functions:**
- Can you explain why we use curly braces `{}` in function definitions?
- What happens if you write `displayGreeting` without the parentheses?
- Why might you want to call the same function multiple times?

```mermaid
flowchart TD
    A["✏️ Define Function"] --> B["📦 Package Code"]
    B --> C["🏷️ Give it a Name"]
    C --> D["📞 Call When Needed"]
    D --> E["🔄 Reuse Anywhere"]
    
    F["💡 Benefits"] --> F1["No code repetition"]
    F --> F2["Easy to maintain"]
    F --> F3["Clear organization"]
    F --> F4["Easier testing"]
    
    style A fill:#e3f2fd
    style E fill:#e8f5e8
    style F fill:#fff3e0
```

> **Note:** You''ve been using **methods** throughout these lessons. `console.log()` is a method – essentially a function that belongs to the `console` object. The key difference is that methods are attached to objects, while functions stand independently. Many developers use these terms interchangeably in casual conversation.

### Function best practices

Here are a few tips to help you write great functions:

- Give your functions clear, descriptive names – your future self will thank you!
- Use **camelCasing** for multi-word names (like `calculateTotal` instead of `calculate_total`)
- Keep each function focused on doing one thing well

## Passing information to a function

Our `displayGreeting` function is limited – it can only display "Hello, world!" for everyone. Parameters allow us to make functions more flexible and useful.

**Parameters** act like placeholders where you can insert different values each time you use the function. This way, the same function can work with different information on each call.

You list parameters inside the parentheses when you define your function, separating multiple parameters with commas:

```javascript
function name(param, param2, param3) {

}
```

Each parameter acts like a placeholder – when someone calls your function, they''ll provide actual values that get plugged into these spots.

Let''s update our greeting function to accept someone''s name:

```javascript
function displayGreeting(name) {
  const message = `Hello, ${name}!`;
  console.log(message);
}
```

Notice how we''re using backticks (`` ` ``) and `${}` to insert the name directly into our message – this is called a template literal, and it''s a really handy way to build strings with variables mixed in.

Now when we call our function, we can pass in any name:

```javascript
displayGreeting(''Christopher'');
// displays "Hello, Christopher!" when run
```

JavaScript takes the string `''Christopher''`, assigns it to the `name` parameter, and creates the personalized message "Hello, Christopher!"

```mermaid
flowchart LR
    A["🎯 Function Call"] --> B["📥 Parameters"]
    B --> C["⚙️ Function Body"]
    C --> D["📤 Result"]
    
    A1["displayGreeting(''Alice'')"] --> A
    B1["name = ''Alice''"] --> B
    C1["Template literal\n\`Hello, \${name}!\`"] --> C
    D1["''Hello, Alice!''"] --> D
    
    E["🔄 Parameter Types"] --> E1["Strings"]
    E --> E2["Numbers"]
    E --> E3["Booleans"]
    E --> E4["Objects"]
    E --> E5["Functions"]
    
    style A fill:#e3f2fd
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#f3e5f5
```

## Default values

What if we want to make some parameters optional? That''s where default values come in handy!

Let''s say we want people to be able to customize the greeting word, but if they don''t specify one, we''ll just use "Hello" as a fallback. You can set up default values by using the equals sign, just like setting a variable:

```javascript
function displayGreeting(name, salutation=''Hello'') {
  console.log(`${salutation}, ${name}`);
}
```

Here, `name` is still required, but `salutation` has a backup value of `''Hello''` if no one provides a different greeting.

Now we can call this function in two different ways:

```javascript
displayGreeting(''Christopher'');
// displays "Hello, Christopher"

displayGreeting(''Christopher'', ''Hi'');
// displays "Hi, Christopher"
```

In the first call, JavaScript uses the default "Hello" since we didn''t specify a salutation. In the second call, it uses our custom "Hi" instead. This flexibility makes functions adaptable to different scenarios.

### 🎛️ **Parameters Mastery Check: Making Functions Flexible**

**Test your parameter understanding:**
- What''s the difference between a parameter and an argument?
- Why are default values useful in real-world programming?
- Can you predict what happens if you pass more arguments than parameters?

```mermaid
stateDiagram-v2
    [*] --> NoParams: function greet() {}
    [*] --> WithParams: function greet(name) {}
    [*] --> WithDefaults: function greet(name, greeting=''Hi'') {}
    
    NoParams --> Static: Same output always
    WithParams --> Dynamic: Changes with input
    WithDefaults --> Flexible: Optional customization
    
    Static --> [*]
    Dynamic --> [*]
    Flexible --> [*]
    
    note right of WithDefaults
        Most flexible approach
        Backwards compatible
    end note
```

> **Pro tip**: Default parameters make your functions more user-friendly. Users can get started quickly with sensible defaults, but still customize when needed!

## Return values

Our functions so far have just been printing messages to the console, but what if you want a function to calculate something and give you back the result?

That''s where **return values** come in. Instead of just displaying something, a function can hand you back a value that you can store in a variable or use in other parts of your code.

To send a value back, you use the `return` keyword followed by whatever you want to return:

```javascript
return myVariable;
```

Here''s something important: when a function hits a `return` statement, it immediately stops running and sends that value back to whoever called it.

Let''s modify our greeting function to return the message instead of printing it:

```javascript
function createGreetingMessage(name) {
  const message = `Hello, ${name}`;
  return message;
}
```

Now instead of printing the greeting, this function creates the message and hands it back to us.

To use the returned value, we can store it in a variable just like any other value:

```javascript
const greetingMessage = createGreetingMessage(''Christopher'');
```

Now `greetingMessage` contains "Hello, Christopher" and we can use it anywhere in our code – to display it on a webpage, include it in an email, or pass it to another function.

```mermaid
flowchart TD
    A["🔧 Function Processing"] --> B{"return statement?"}
    B -->|Yes| C["📤 Return Value"]
    B -->|No| D["📭 Return undefined"]
    
    C --> E["💾 Store in Variable"]
    C --> F["🔗 Use in Expression"]
    C --> G["📞 Pass to Function"]
    
    D --> H["⚠️ Usually not useful"]
    
    I["📋 Return Value Uses"] --> I1["Calculate results"]
    I --> I2["Validate input"]
    I --> I3["Transform data"]
    I --> I4["Create objects"]
    
    style C fill:#e8f5e8
    style D fill:#ffebee
    style I fill:#e3f2fd
```

### 🔄 **Return Values Check: Getting Results Back**

**Evaluate your return value understanding:**
- What happens to code after a `return` statement in a function?
- Why is returning values often better than just printing to console?
- Can a function return different types of values (string, number, boolean)?

```mermaid
pie title "Common Return Value Types"
    "Strings" : 30
    "Numbers" : 25
    "Objects" : 20
    "Booleans" : 15
    "Arrays" : 10
```

> **Key insight**: Functions that return values are more versatile because the caller decides what to do with the result. This makes your code more modular and reusable!

## Functions as parameters for functions

Functions can be passed as parameters to other functions. While this concept may seem complex initially, it''s a powerful feature that enables flexible programming patterns.

This pattern is super common when you want to say "when something happens, do this other thing." For example, "when the timer finishes, run this code" or "when the user clicks the button, call this function."

Let''s look at `setTimeout`, which is a built-in function that waits a certain amount of time and then runs some code. We need to tell it what code to run – perfect use case for passing a function!

Try this code – after 3 seconds, you''ll see a message:

```javascript
function displayDone() {
  console.log(''3 seconds has elapsed'');
}
// timer value is in milliseconds
setTimeout(displayDone, 3000);
```

Notice how we pass `displayDone` (without parentheses) to `setTimeout`. We''re not calling the function ourselves – we''re handing it over to `setTimeout` and saying "call this in 3 seconds."

### Anonymous functions

Sometimes you need a function for just one thing and don''t want to give it a name. Think about it – if you''re only using a function once, why clutter up your code with an extra name?

JavaScript lets you create **anonymous functions** – functions without names that you can define right where you need them.

Here''s how we can rewrite our timer example using an anonymous function:

```javascript
setTimeout(function() {
  console.log(''3 seconds has elapsed'');
}, 3000);
```

This achieves the same result, but the function is defined directly within the `setTimeout` call, eliminating the need for a separate function declaration.

### Fat arrow functions

Modern JavaScript has an even shorter way to write functions called **arrow functions**. They use `=>` (which looks like an arrow – get it?) and are super popular with developers.

Arrow functions let you skip the `function` keyword and write more concise code.

Here''s our timer example using an arrow function:

```javascript
setTimeout(() => {
  console.log(''3 seconds has elapsed'');
}, 3000);
```

The `()` is where parameters would go (empty in this case), then comes the arrow `=>`, and finally the function body in curly braces. This provides the same functionality with more concise syntax.

```mermaid
flowchart LR
    A["📝 Function Styles"] --> B["Traditional"]
    A --> C["Arrow"]
    A --> D["Anonymous"]
    
    B --> B1["function name() {}"]
    B --> B2["Hoisted"]
    B --> B3["Named"]
    
    C --> C1["const name = () => {}"]
    C --> C2["Concise syntax"]
    C --> C3["Modern style"]
    
    D --> D1["function() {}"]
    D --> D2["No name"]
    D --> D3["One-time use"]
    
    E["⏰ When to Use"] --> E1["Traditional: Reusable functions"]
    E --> E2["Arrow: Short callbacks"]
    E --> E3["Anonymous: Event handlers"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
```

### When to use each strategy

When should you use each approach? A practical guideline: if you''ll use the function multiple times, give it a name and define it separately. If it''s for one specific use, consider an anonymous function. Both arrow functions and traditional syntax are valid choices, though arrow functions are prevalent in modern JavaScript codebases.

### 🎨 **Function Styles Mastery Check: Choosing the Right Syntax**

**Test your syntax understanding:**
- When might you prefer arrow functions over traditional function syntax?
- What''s the main advantage of anonymous functions?
- Can you think of a situation where a named function is better than an anonymous one?

```mermaid
quadrantChart
    title Function Choice Decision Matrix
    x-axis Simple --> Complex
    y-axis One-time use --> Reusable
    quadrant-1 Arrow Functions
    quadrant-2 Named Functions
    quadrant-3 Anonymous Functions
    quadrant-4 Traditional Functions
    
    Event Handlers: [0.3, 0.2]
    Utility Functions: [0.7, 0.8]
    Callbacks: [0.2, 0.3]
    Class Methods: [0.8, 0.7]
    Mathematical Operations: [0.4, 0.6]
```

> **Modern trend**: Arrow functions are becoming the default choice for many developers because of their concise syntax, but traditional functions still have their place!

---



## 🚀 Challenge

Can you articulate in one sentence the difference between functions and methods? Give it a try!

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Create a utility library of mathematical functions that demonstrates different function concepts covered in this lesson, including parameters, default values, return values, and arrow functions.

**Prompt:** Create a JavaScript file called `mathUtils.js` that contains the following functions:
1. A function `add` that takes two parameters and returns their sum
2. A function `multiply` with default parameter values (second parameter defaults to 1)
3. An arrow function `square` that takes a number and returns its square
4. A function `calculate` that accepts another function as a parameter and two numbers, then applies the function to those numbers
5. Demonstrate calling each function with appropriate test cases

Learn more about agent mode (https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) here.

## Post-Lecture Quiz
Post-lecture quiz (https://ff-quizzes.netlify.app/)

## Review & Self Study

It''s worth reading up a little more on arrow functions (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Functions/Arrow_functions), as they are increasingly used in code bases. Practice writing a function, and then rewriting it with this syntax.

## Assignment

Fun with Functions (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/2-js-basics/2-functions-methods/assignment.md)

---

## 🧰 **Your JavaScript Functions Toolkit Summary**

```mermaid
graph TD
    A["🎯 JavaScript Functions"] --> B["📋 Function Declaration"]
    A --> C["📥 Parameters"]
    A --> D["📤 Return Values"]
    A --> E["🎨 Modern Syntax"]
    
    B --> B1["function name() {}"]
    B --> B2["Descriptive naming"]
    B --> B3["Reusable code blocks"]
    
    C --> C1["Input data"]
    C --> C2["Default values"]
    C --> C3["Multiple parameters"]
    
    D --> D1["return statement"]
    D --> D2["Exit function"]
    D --> D3["Pass data back"]
    
    E --> E1["Arrow functions: () =>"]
    E --> E2["Anonymous functions"]
    E --> E3["Higher-order functions"]
    
    F["⚡ Key Benefits"] --> F1["Code reusability"]
    F --> F2["Better organization"]
    F --> F3["Easier testing"]
    F --> F4["Modular design"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
    style F fill:#fce4ec
```

---

## 🚀 Your JavaScript Functions Mastery Timeline

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Write a simple function that returns your favorite number
- [ ] Create a function with two parameters that adds them together
- [ ] Try converting a traditional function to arrow function syntax
- [ ] Practice the challenge: explain the difference between functions and methods

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and review any confusing concepts
- [ ] Build the math utilities library from the GitHub Copilot challenge
- [ ] Create a function that uses another function as a parameter
- [ ] Practice writing functions with default parameters
- [ ] Experiment with template literals in function return values

### 📅 **Your Week-Long Function Mastery**
- [ ] Complete the "Fun with Functions" assignment with creativity
- [ ] Refactor some repetitive code you''ve written into reusable functions
- [ ] Build a small calculator using only functions (no global variables)
- [ ] Practice arrow functions with array methods like `map()` and `filter()`
- [ ] Create a collection of utility functions for common tasks
- [ ] Study higher-order functions and functional programming concepts

### 🌟 **Your Month-Long Transformation**
- [ ] Master advanced function concepts like closures and scope
- [ ] Build a project that heavily uses function composition
- [ ] Contribute to open source by improving function documentation
- [ ] Teach someone else about functions and different syntax styles
- [ ] Explore functional programming paradigms in JavaScript
- [ ] Create a personal library of reusable functions for future projects

### 🏆 **Final Functions Champion Check-in**

**Celebrate your function mastery:**
- What''s the most useful function you''ve created so far?
- How has learning about functions changed the way you think about code organization?
- Which function syntax do you prefer and why?
- What real-world problem would you solve by writing a function?

```mermaid
journey
    title Your Function Confidence Evolution
    section Today
      Confused by Syntax: 3: You
      Understanding Basics: 4: You
      Writing Simple Functions: 5: You
    section This Week
      Using Parameters: 4: You
      Returning Values: 5: You
      Modern Syntax: 5: You
    section Next Month
      Function Composition: 5: You
      Advanced Patterns: 5: You
      Teaching Others: 5: You
```

> 🎉 **You''ve mastered one of programming''s most powerful concepts!** Functions are the building blocks of larger programs. Every application you''ll ever build will use functions to organize, reuse, and structure code. You now understand how to package logic into reusable components, making you a more efficient and effective programmer. Welcome to the world of modular programming! 🚀',16);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'javascript-foundations-3','JavaScript Basics: Making Decisions',3,'# JavaScript Basics: Making Decisions



> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

```mermaid
journey
    title Your JavaScript Decision-Making Adventure
    section Foundation
      Boolean Values: 5: You
      Comparison Operators: 4: You
      Logical Thinking: 5: You
    section Basic Decisions
      If Statements: 4: You
      If-Else Logic: 5: You
      Switch Statements: 4: You
    section Advanced Logic
      Logical Operators: 5: You
      Complex Conditions: 4: You
      Ternary Expressions: 5: You
```

Have you ever wondered how applications make smart decisions? Like how a navigation system chooses the fastest route, or how a thermostat decides when to turn on the heat? This is the fundamental concept of decision-making in programming.

Just as Charles Babbage''s Analytical Engine was designed to follow different sequences of operations based on conditions, modern JavaScript programs need to make choices based on varying circumstances. This ability to branch and make decisions is what transforms static code into responsive, intelligent applications.

In this lesson, you''ll learn how to implement conditional logic in your programs. We''ll explore conditional statements, comparison operators, and logical expressions that allow your code to evaluate situations and respond appropriately.

## Pre-Lecture Quiz

Pre-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/11)

The ability to make decisions and control program flow is a fundamental aspect of programming. This section covers how to control the execution path of your JavaScript programs using Boolean values and conditional logic.

[](https://youtube.com/watch?v=SxTp8j-fMMY "Making Decisions")

> 🎥 Click the image above for a video about making decisions.

> You can take this lesson on Microsoft Learn (https://docs.microsoft.com/learn/modules/web-development-101-if-else/?WT.mc_id=academic-77807-sagibbon)!

```mermaid
mindmap
  root((Decision Making))
    Boolean Logic
      true/false
      Comparison results
      Logical expressions
    Conditional Statements
      if statements
        Single condition
        Code execution
      if-else
        Two paths
        Alternative actions
      switch
        Multiple options
        Clean structure
    Operators
      Comparison
        === !==  =
        Value relationships
      Logical
        && || !
        Combine conditions
    Advanced Patterns
      Ternary
        ? : syntax
        Inline decisions
      Complex Logic
        Nested conditions
        Multiple criteria
```

## A Brief Recap on Booleans

Before exploring decision-making, let''s revisit Boolean values from our previous lesson. Named after mathematician George Boole, these values represent binary states – either `true` or `false`. There''s no ambiguity, no middle ground.

These binary values form the foundation of all computational logic. Every decision your program makes ultimately reduces to a Boolean evaluation.

Creating Boolean variables is straightforward:

```javascript
let myTrueBool = true;
let myFalseBool = false;
```

This creates two variables with explicit Boolean values.

✅ Booleans are named after the English mathematician, philosopher and logician George Boole (1815–1864).

## Comparison Operators and Booleans

In practice, you''ll rarely set Boolean values manually. Instead, you''ll generate them by evaluating conditions: "Is this number greater than that one?" or "Are these values equal?"

Comparison operators enable these evaluations. They compare values and return Boolean results based on the relationship between the operands.

| Symbol | Description                                                                                                                                                   | Example            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| ``    | **Greater than**: Compares two values and returns the `true` Boolean data type if the value on the left side is larger than the right                         | `5 > 6 // false`   |
| `>=`   | **Greater than or equal to**: Compares two values and returns the `true` Boolean data type if the value on the left side is larger than or equal to the right | `5 >= 6 // false`  |
| `===`  | **Strict equality**: Compares two values and returns the `true` Boolean data type if values on the right and left are equal AND are the same data type.       | `5 === 6 // false` |
| `!==`  | **Inequality**: Compares two values and returns the opposite Boolean value of what a strict equality operator would return                                    | `5 !== 6 // true`  |

✅ Check your knowledge by writing some comparisons in your browser''s console. Does any returned data surprise you?

```mermaid
flowchart LR
    A["🔢 Values"] --> B["⚖️ Comparison"]
    B --> C["✅ Boolean Result"]
    
    D["5"] --> E[" F["true"]
    
    G["10"] --> H["=== ''10''"]
    H --> I["false"]
    
    J["''hello''"] --> K["!== ''world''"]
    K --> L["true"]
    
    M["📋 Operator Types"] --> M1["Equality: === !=="]
    M --> M2["Relational:  ="]
    M --> M3["Strict vs Loose"]
    
    style A fill:#e3f2fd
    style C fill:#e8f5e8
    style M fill:#fff3e0
```

### 🧠 **Comparison Mastery Check: Understanding Boolean Logic**

**Test your comparison understanding:**
- Why do you think `===` (strict equality) is generally preferred over `==` (loose equality)?
- Can you predict what `5 === ''5''` returns? How about `5 == ''5''`?
- What''s the difference between `!==` and `!=`?

```mermaid
stateDiagram-v2
    [*] --> Comparison: Two values
    Comparison --> StrictEqual: === or !==
    Comparison --> Relational:  =
    
    StrictEqual --> TypeCheck: Check type AND value
    Relational --> NumberCompare: Convert to numbers
    
    TypeCheck --> BooleanResult: true or false
    NumberCompare --> BooleanResult
    
    note right of StrictEqual
        Preferred approach
        No type conversion
    end note
    
    note right of Relational
        Useful for ranges
        Numerical comparisons
    end note
```

> **Pro tip**: Always use `===` and `!==` for equality checks unless you specifically need type conversion. This prevents unexpected behavior!

## If Statement

The `if` statement is like asking a question in your code. "If this condition is true, then do this thing." It''s probably the most important tool you''ll use for making decisions in JavaScript.

Here''s how it works:

```javascript
if (condition) {
  // Condition is true. Code in this block will run.
}
```

The condition goes inside the parentheses, and if it''s `true`, JavaScript runs the code inside the curly braces. If it''s `false`, JavaScript just skips that whole block.

You''ll often use comparison operators to create these conditions. Let''s see a practical example:

```javascript
let currentMoney = 1000;
let laptopPrice = 800;

if (currentMoney >= laptopPrice) {
  // Condition is true. Code in this block will run.
  console.log("Getting a new laptop!");
}
```

Since `1000 >= 800` evaluates to `true`, the code inside the block executes, displaying "Getting a new laptop!" in the console.

```mermaid
flowchart TD
    A["🚀 Program Start"] --> B{"💰 currentMoney >= laptopPrice?"}
    B -->|true| C["🎉 ''Getting a new laptop!''"]
    B -->|false| D["⏭️ Skip code block"]
    C --> E["📋 Continue program"]
    D --> E
    
    F["📊 If Statement Structure"] --> F1["if (condition) {"]
    F1 --> F2["  // code to run if true"]
    F2 --> F3["}"]
    
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style D fill:#ffebee
    style F fill:#e3f2fd
```

## If..Else Statement

But what if you want your program to do something different when the condition is false? That''s where `else` comes in – it''s like having a backup plan.

The `else` statement gives you a way to say "if this condition isn''t true, do this other thing instead."

```javascript
let currentMoney = 500;
let laptopPrice = 800;

if (currentMoney >= laptopPrice) {
  // Condition is true. Code in this block will run.
  console.log("Getting a new laptop!");
} else {
  // Condition is false. Code in this block will run.
  console.log("Can''t afford a new laptop, yet!");
}
```

Now since `500 >= 800` is `false`, JavaScript skips the first block and runs the `else` block instead. You''ll see "Can''t afford a new laptop, yet!" in the console.

✅ Test your understanding of this code and the following code by running it in a browser console. Change the values of the currentMoney and laptopPrice variables to change the returned `console.log()`.

### 🎯 **If-Else Logic Check: Branching Paths**

**Evaluate your conditional logic understanding:**
- What happens if `currentMoney` exactly equals `laptopPrice`?
- Can you think of a real-world scenario where if-else logic would be useful?
- How might you extend this to handle multiple price ranges?

```mermaid
flowchart TD
    A["🔍 Evaluate Condition"] --> B{"Condition True?"}
    B -->|Yes| C["📤 Execute IF block"]
    B -->|No| D["📥 Execute ELSE block"]
    
    C --> E["✅ One path taken"]
    D --> E
    
    F["🌐 Real-world Examples"] --> F1["User login status"]
    F --> F2["Age verification"]
    F --> F3["Form validation"]
    F --> F4["Game state changes"]
    
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style D fill:#e3f2fd
    style F fill:#f3e5f5
```

> **Key insight**: If-else ensures exactly one path is taken. This guarantees your program always has a response to any condition!

## Switch Statement

Sometimes you need to compare one value against multiple options. While you could chain several `if..else` statements, this approach becomes unwieldy. The `switch` statement provides a cleaner structure for handling multiple discrete values.

The concept resembles the mechanical switching systems used in early telephone exchanges – one input value determines which specific path the execution follows.

```javascript
switch (expression) {
  case x:
    // code block
    break;
  case y:
    // code block
    break;
  default:
    // code block
}
```

Here''s how it''s structured:
- JavaScript evaluates the expression once
- It looks through each `case` to find a match
- When it finds a match, it runs that code block
- The `break` tells JavaScript to stop and exit the switch
- If no cases match, it runs the `default` block (if you have one)

```javascript
// Program using switch statement for day of week
let dayNumber = 2;
let dayName;

switch (dayNumber) {
  case 1:
    dayName = "Monday";
    break;
  case 2:
    dayName = "Tuesday";
    break;
  case 3:
    dayName = "Wednesday";
    break;
  default:
    dayName = "Unknown day";
    break;
}
console.log(`Today is ${dayName}`);
```

In this example, JavaScript sees that `dayNumber` is `2`, finds the matching `case 2`, sets `dayName` to "Tuesday", and then breaks out of the switch. The result? "Today is Tuesday" gets logged to the console.

```mermaid
flowchart TD
    A["📥 switch(expression)"] --> B["🔍 Evaluate once"]
    B --> C{"Match case 1?"}
    C -->|Yes| D["📋 Execute case 1"]
    C -->|No| E{"Match case 2?"}
    E -->|Yes| F["📋 Execute case 2"]
    E -->|No| G{"Match case 3?"}
    G -->|Yes| H["📋 Execute case 3"]
    G -->|No| I["📋 Execute default"]
    
    D --> J["🛑 break"]
    F --> K["🛑 break"]
    H --> L["🛑 break"]
    
    J --> M["✅ Exit switch"]
    K --> M
    L --> M
    I --> M
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style M fill:#e8f5e8
```

✅ Test your understanding of this code and the following code by running it in a browser console. Change the values of the variable a to change the returned `console.log()`.

### 🔄 **Switch Statement Mastery: Multiple Options**

**Test your switch understanding:**
- What happens if you forget a `break` statement?
- When would you use `switch` instead of multiple `if-else` statements?
- Why is the `default` case useful even if you think you''ve covered all possibilities?

```mermaid
pie title "When to Use Each Decision Structure"
    "Simple if-else" : 40
    "Complex if-else chains" : 25
    "Switch statements" : 20
    "Ternary operators" : 15
```

> **Best practice**: Use `switch` when comparing one variable against multiple specific values. Use `if-else` for range checks or complex conditions!

## Logical Operators and Booleans

Complex decisions often require evaluating multiple conditions simultaneously. Just as Boolean algebra allows mathematicians to combine logical expressions, programming provides logical operators to connect multiple Boolean conditions.

These operators enable sophisticated conditional logic by combining simple true/false evaluations.

| Symbol | Description                                                                                     | Example                                                                 |
| ------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `&&`   | **Logical AND**: Compares two Boolean expressions. Returns true **only** if both sides are true | `(5 > 3) && (5  10) \|\| (5  10) // 5 is not greater than 10, so "!" makes it true`         |

These operators let you combine conditions in useful ways:
- AND (`&&`) means both conditions must be true
- OR (`||`) means at least one condition must be true  
- NOT (`!`) flips true to false (and vice versa)

```mermaid
flowchart LR
    A["🔗 Logical Operators"] --> B["&& AND"]
    A --> C["|| OR"]
    A --> D["! NOT"]
    
    B --> B1["Both must be true"]
    B --> B2["true && true = true"]
    B --> B3["true && false = false"]
    
    C --> C1["At least one true"]
    C --> C2["true || false = true"]
    C --> C3["false || false = false"]
    
    D --> D1["Flips the value"]
    D --> D2["!true = false"]
    D --> D3["!false = true"]
    
    E["🌍 Real Examples"] --> E1["Age >= 18 && hasLicense"]
    E --> E2["isWeekend || isHoliday"]
    E --> E3["!isLoggedIn"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
```

## Conditions and Decisions with Logical Operators

Let''s see these logical operators in action with a more realistic example:

```javascript
let currentMoney = 600;
let laptopPrice = 800;
let laptopDiscountPrice = laptopPrice - (laptopPrice * 0.2); // Laptop price at 20 percent off

if (currentMoney >= laptopPrice || currentMoney >= laptopDiscountPrice) {
  // Condition is true. Code in this block will run.
  console.log("Getting a new laptop!");
} else {
  // Condition is false. Code in this block will run.
  console.log("Can''t afford a new laptop, yet!");
}
```

In this example: we calculate a 20% discount price (640), then evaluate whether our available funds cover either the full price OR the discounted price. Since 600 meets the discounted price threshold of 640, the condition evaluates to true.

### 🧮 **Logical Operators Check: Combining Conditions**

**Test your logical operator understanding:**
- In the expression `A && B`, what happens if A is false? Does B even get evaluated?
- Can you think of a situation where you''d need all three operators (&&, ||, !) together?
- What''s the difference between `!user.isActive` and `user.isActive !== true`?

```mermaid
stateDiagram-v2
    [*] --> EvaluateA: A && B
    EvaluateA --> CheckB: A is true
    EvaluateA --> ReturnFalse: A is false
    CheckB --> ReturnTrue: B is true
    CheckB --> ReturnFalse: B is false
    
    [*] --> EvaluateC: A || B
    EvaluateC --> ReturnTrue: A is true
    EvaluateC --> CheckD: A is false
    CheckD --> ReturnTrue: B is true
    CheckD --> ReturnFalse: B is false
    
    note right of EvaluateA
        Short-circuit evaluation:
        If A is false, B is never checked
    end note
```

> **Performance tip**: JavaScript uses "short-circuit evaluation" - in `A && B`, if A is false, B isn''t even evaluated. Use this to your advantage!

### Negation Operator

Sometimes it''s easier to think about when something is NOT true. Like instead of asking "Is the user logged in?", you might want to ask "Is the user NOT logged in?" The exclamation mark (`!`) operator flips the logic for you.

```javascript
if (!condition) {
  // runs if condition is false
} else {
  // runs if condition is true
}
```

The `!` operator is like saying "the opposite of..." – if something is `true`, `!` makes it `false`, and vice versa.

### Ternary Expressions

For simple conditional assignments, JavaScript provides the **ternary operator**. This concise syntax allows you to write a conditional expression in a single line, useful when you need to assign one of two values based on a condition.

```javascript
let variable = condition ? returnThisIfTrue : returnThisIfFalse;
```

It reads like a question: "Is this condition true? If yes, use this value. If no, use that value."

Below is a more tangible example:

```javascript
let firstNumber = 20;
let secondNumber = 10;
let biggestNumber = firstNumber > secondNumber ? firstNumber : secondNumber;
```

✅ Take a minute to read this code a few times. Do you understand how these operators are working?

Here''s what this line is saying: "Is `firstNumber` greater than `secondNumber`? If yes, put `firstNumber` in `biggestNumber`. If no, put `secondNumber` in `biggestNumber`."

The ternary operator is just a shorter way to write this traditional `if..else` statement:

```javascript
let biggestNumber;
if (firstNumber > secondNumber) {
  biggestNumber = firstNumber;
} else {
  biggestNumber = secondNumber;
}
```

Both approaches produce identical results. The ternary operator offers conciseness, while the traditional if-else structure may be more readable for complex conditions.

```mermaid
flowchart LR
    A["🤔 Ternary Operator"] --> B["condition ?"]
    B --> C["valueIfTrue :"]
    C --> D["valueIfFalse"]
    
    E["📝 Traditional If-Else"] --> F["if (condition) {"]
    F --> G["  return valueIfTrue"]
    G --> H["} else {"]
    H --> I["  return valueIfFalse"]
    I --> J["}"]
    
    K["⚡ When to Use"] --> K1["Simple assignments"]
    K --> K2["Short conditions"]
    K --> K3["Inline decisions"]
    K --> K4["Return statements"]
    
    style A fill:#e3f2fd
    style E fill:#fff3e0
    style K fill:#e8f5e8
```

---



## 🚀 Challenge

Create a program that is written first with logical operators, and then rewrite it using a ternary expression. What''s your preferred syntax?

---

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Create a comprehensive grade calculator that demonstrates multiple decision-making concepts from this lesson, including if-else statements, switch statements, logical operators, and ternary expressions.

**Prompt:** Write a JavaScript program that takes a student''s numerical score (0-100) and determines their letter grade using the following criteria:
- A: 90-100
- B: 80-89  
- C: 70-79
- D: 60-69
- F: Below 60

Requirements:
1. Use an if-else statement to determine the letter grade
2. Use logical operators to check if the student passes (grade >= 60) AND has honors (grade >= 90)
3. Use a switch statement to provide specific feedback for each letter grade
4. Use a ternary operator to determine if the student is eligible for the next course (grade >= 70)
5. Include input validation to ensure the score is between 0 and 100

Test your program with various scores including edge cases like 59, 60, 89, 90, and invalid inputs.

Learn more about agent mode (https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) here.


## Post-Lecture Quiz

Post-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/12)

## Review & Self Study

Read more about the many operators available to the user on MDN (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators).

Go through Josh Comeau''s wonderful operator lookup (https://joshwcomeau.com/operator-lookup/)!

## Assignment

Operators (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/2-js-basics/3-making-decisions/assignment.md)

---

## 🧠 **Your Decision-Making Toolkit Summary**

```mermaid
graph TD
    A["🎯 JavaScript Decisions"] --> B["🔍 Boolean Logic"]
    A --> C["📊 Conditional Statements"]
    A --> D["🔗 Logical Operators"]
    A --> E["⚡ Advanced Patterns"]
    
    B --> B1["true/false values"]
    B --> B2["Comparison operators"]
    B --> B3["Truthiness concepts"]
    
    C --> C1["if statements"]
    C --> C2["if-else chains"]
    C --> C3["switch statements"]
    
    D --> D1["&& (AND)"]
    D --> D2["|| (OR)"]
    D --> D3["! (NOT)"]
    
    E --> E1["Ternary operator"]
    E --> E2["Short-circuit evaluation"]
    E --> E3["Complex conditions"]
    
    F["💡 Key Principles"] --> F1["Clear readable conditions"]
    F --> F2["Consistent comparison style"]
    F --> F3["Proper operator precedence"]
    F --> F4["Efficient evaluation order"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
    style F fill:#fce4ec
```

---

## 🚀 Your JavaScript Decision-Making Mastery Timeline

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Practice comparison operators in your browser console
- [ ] Write a simple if-else statement that checks your age
- [ ] Try the challenge: rewrite an if-else using a ternary operator
- [ ] Test what happens with different "truthy" and "falsy" values

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and review any confusing concepts
- [ ] Build the comprehensive grade calculator from the GitHub Copilot challenge
- [ ] Create a simple decision tree for a real-world scenario (like choosing what to wear)
- [ ] Practice combining multiple conditions with logical operators
- [ ] Experiment with switch statements for different use cases

### 📅 **Your Week-Long Logic Mastery**
- [ ] Complete the operators assignment with creative examples
- [ ] Build a mini quiz application using various conditional structures
- [ ] Create a form validator that checks multiple input conditions
- [ ] Practice Josh Comeau''s operator lookup (https://joshwcomeau.com/operator-lookup/) exercises
- [ ] Refactor existing code to use more appropriate conditional structures
- [ ] Study short-circuit evaluation and performance implications

### 🌟 **Your Month-Long Transformation**
- [ ] Master complex nested conditions and maintain code readability
- [ ] Build an application with sophisticated decision-making logic
- [ ] Contribute to open source by improving conditional logic in existing projects
- [ ] Teach someone else about different conditional structures and when to use each
- [ ] Explore functional programming approaches to conditional logic
- [ ] Create a personal reference guide for conditional best practices

### 🏆 **Final Decision-Making Champion Check-in**

**Celebrate your logical thinking mastery:**
- What''s the most complex decision logic you''ve successfully implemented?
- Which conditional structure feels most natural to you and why?
- How has learning about logical operators changed your problem-solving approach?
- What real-world application would benefit from sophisticated decision-making logic?

```mermaid
journey
    title Your Logical Thinking Evolution
    section Today
      Boolean Confusion: 3: You
      If-Else Understanding: 4: You
      Operator Recognition: 5: You
    section This Week
      Complex Conditions: 4: You
      Switch Mastery: 5: You
      Logical Combinations: 5: You
    section Next Month
      Advanced Patterns: 5: You
      Performance Awareness: 5: You
      Teaching Others: 5: You
```

> 🧠 **You''ve mastered the art of digital decision-making!** Every interactive application relies on conditional logic to respond intelligently to user actions and changing conditions. You now understand how to make your programs think, evaluate, and choose appropriate responses. This logical foundation will power every dynamic application you build! 🎉',18);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'javascript-foundations-4','JavaScript Basics: Arrays and Loops',4,'# JavaScript Basics: Arrays and Loops


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

```mermaid
journey
    title Your Arrays & Loops Adventure
    section Array Fundamentals
      Creating Arrays: 5: You
      Accessing Elements: 4: You
      Array Methods: 5: You
    section Loop Mastery
      For Loops: 4: You
      While Loops: 5: You
      Modern Syntax: 4: You
    section Data Processing
      Array + Loops: 5: You
      Real-world Applications: 4: You
      Performance Optimization: 5: You
```

## Pre-Lecture Quiz
Pre-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/13)

Ever wondered how websites keep track of shopping cart items or display your friend list? That''s where arrays and loops come in. Arrays are like digital containers that hold multiple pieces of information, while loops let you work with all that data efficiently without repetitive code.

Together, these two concepts form the foundation for handling information in your programs. You''ll learn to move from manually writing out every single step to creating smart, efficient code that can process hundreds or even thousands of items quickly.

By the end of this lesson, you''ll understand how to accomplish complex data tasks with just a few lines of code. Let''s explore these essential programming concepts.

[](https://youtube.com/watch?v=1U4qTyq02Xw "Arrays")

[](https://www.youtube.com/watch?v=Eeh7pxtTZ3k "Loops")

> 🎥 Click the images above for videos about arrays and loops.

> You can take this lesson on Microsoft Learn (https://docs.microsoft.com/learn/modules/web-development-101-arrays/?WT.mc_id=academic-77807-sagibbon)!

```mermaid
mindmap
  root((Data Processing))
    Arrays
      Structure
        Square brackets syntax
        Zero-based indexing
        Dynamic sizing
      Operations
        push/pop
        shift/unshift
        indexOf/includes
      Types
        Numbers array
        Strings array
        Mixed types
    Loops
      For Loops
        Counting iterations
        Array processing
        Predictable flow
      While Loops
        Condition-based
        Unknown iterations
        User input
      Modern Syntax
        for...of
        forEach
        Functional methods
    Applications
      Data Analysis
        Statistics
        Filtering
        Transformations
      User Interfaces
        Lists
        Menus
        Galleries
```

## Arrays

Think of arrays as a digital filing cabinet - instead of storing one document per drawer, you can organize multiple related items in a single, structured container. In programming terms, arrays let you store multiple pieces of information in one organized package.

Whether you''re building a photo gallery, managing a to-do list, or keeping track of high scores in a game, arrays provide the foundation for data organization. Let''s see how they work.

✅ Arrays are all around us! Can you think of a real-life example of an array, such as a solar panel array?

### Creating Arrays

Creating an array is super simple - just use square brackets!

```javascript
// Empty array - like an empty shopping cart waiting for items
const myArray = [];
```

**What''s happening here?**
You''ve just created an empty container using those square brackets `[]`. Think of it like an empty library shelf - it''s ready to hold whatever books you want to organize there.

You can also fill your array with initial values right from the start:

```javascript
// Your ice cream shop''s flavor menu
const iceCreamFlavors = ["Chocolate", "Strawberry", "Vanilla", "Pistachio", "Rocky Road"];

// A user''s profile info (mixing different types of data)
const userData = ["John", 25, true, "developer"];

// Test scores for your favorite class
const scores = [95, 87, 92, 78, 85];
```

**Cool things to notice:**
- You can store text, numbers, or even true/false values in the same array
- Just separate each item with a comma - easy!
- Arrays are perfect for keeping related information together

```mermaid
flowchart LR
    A["📦 Arrays"] --> B["Create [ ]"]
    A --> C["Store Multiple Items"]
    A --> D["Access by Index"]
    
    B --> B1["const arr = []"]
    B --> B2["const arr = [1,2,3]"]
    
    C --> C1["Numbers"]
    C --> C2["Strings"]
    C --> C3["Booleans"]
    C --> C4["Mixed Types"]
    
    D --> D1["arr[0] = first"]
    D --> D2["arr[1] = second"]
    D --> D3["arr[2] = third"]
    
    E["📊 Array Index"] --> E1["Index 0: First"]
    E --> E2["Index 1: Second"]
    E --> E3["Index 2: Third"]
    E --> E4["Index n-1: Last"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
```

### Array Indexing

Here''s something that might seem unusual at first: arrays number their items starting from 0, not 1. This zero-based indexing has its roots in how computer memory works - it''s been a programming convention since the early days of computing languages like C. Each spot in the array gets its own address number called an **index**.

| Index | Value | Description |
|-------|-------|-------------|
| 0 | "Chocolate" | First element |
| 1 | "Strawberry" | Second element |
| 2 | "Vanilla" | Third element |
| 3 | "Pistachio" | Fourth element |
| 4 | "Rocky Road" | Fifth element |

✅ Does it surprise you that arrays start at the zero index? In some programming languages, indexes start at 1. There''s an interesting history around this, which you can read on Wikipedia (https://en.wikipedia.org/wiki/Zero-based_numbering).

**Accessing Array Elements:**

```javascript
const iceCreamFlavors = ["Chocolate", "Strawberry", "Vanilla", "Pistachio", "Rocky Road"];

// Access individual elements using bracket notation
console.log(iceCreamFlavors[0]); // "Chocolate" - first element
console.log(iceCreamFlavors[2]); // "Vanilla" - third element
console.log(iceCreamFlavors[4]); // "Rocky Road" - last element
```

**Breaking down what happens here:**
- **Uses** square bracket notation with the index number to access elements
- **Returns** the value stored at that specific position in the array
- **Starts** counting from 0, making the first element index 0

**Modifying Array Elements:**

```javascript
// Change an existing value
iceCreamFlavors[4] = "Butter Pecan";
console.log(iceCreamFlavors[4]); // "Butter Pecan"

// Add a new element at the end
iceCreamFlavors[5] = "Cookie Dough";
console.log(iceCreamFlavors[5]); // "Cookie Dough"
```

**In the above, we''ve:**
- **Modified** the element at index 4 from "Rocky Road" to "Butter Pecan"
- **Added** a new element "Cookie Dough" at index 5
- **Expanded** the array length automatically when adding beyond current bounds

### Array Length and Common Methods

Arrays come with built-in properties and methods that make working with data much easier.

**Finding Array Length:**

```javascript
const iceCreamFlavors = ["Chocolate", "Strawberry", "Vanilla", "Pistachio", "Rocky Road"];
console.log(iceCreamFlavors.length); // 5

// Length updates automatically as array changes
iceCreamFlavors.push("Mint Chip");
console.log(iceCreamFlavors.length); // 6
```

**Key points to remember:**
- **Returns** the total number of elements in the array
- **Updates** automatically when elements are added or removed
- **Provides** a dynamic count useful for loops and validation

**Essential Array Methods:**

```javascript
const fruits = ["apple", "banana", "orange"];

// Add elements
fruits.push("grape");           // Adds to end: ["apple", "banana", "orange", "grape"]
fruits.unshift("strawberry");   // Adds to beginning: ["strawberry", "apple", "banana", "orange", "grape"]

// Remove elements
const lastFruit = fruits.pop();        // Removes and returns "grape"
const firstFruit = fruits.shift();     // Removes and returns "strawberry"

// Find elements
const index = fruits.indexOf("banana"); // Returns 1 (position of "banana")
const hasApple = fruits.includes("apple"); // Returns true
```

**Understanding these methods:**
- **Adds** elements with `push()` (end) and `unshift()` (beginning)
- **Removes** elements with `pop()` (end) and `shift()` (beginning)
- **Locates** elements with `indexOf()` and checks existence with `includes()`
- **Returns** useful values like removed elements or position indexes

✅ Try it yourself! Use your browser''s console to create and manipulate an array of your own creation.

### 🧠 **Array Fundamentals Check: Organizing Your Data**

**Test your array understanding:**
- Why do you think arrays start counting from 0 instead of 1?
- What happens if you try to access an index that doesn''t exist (like `arr[100]` in a 5-element array)?
- Can you think of three real-world scenarios where arrays would be useful?

```mermaid
stateDiagram-v2
    [*] --> EmptyArray: const arr = []
    EmptyArray --> WithItems: Add elements
    WithItems --> Accessing: Use indexes
    Accessing --> Modifying: Change values
    Modifying --> Processing: Use methods
    
    WithItems --> WithItems: push(), unshift()
    Processing --> Processing: pop(), shift()
    
    note right of Accessing
        Zero-based indexing
        arr[0] = first element
    end note
    
    note right of Processing
        Built-in methods
        Dynamic operations
    end note
```

> **Real-world insight**: Arrays are everywhere in programming! Social media feeds, shopping carts, photo galleries, playlist songs - they''re all arrays behind the scenes!

## Loops

Think of the famous punishment from Charles Dickens'' novels where students had to write lines repeatedly on a slate. Imagine if you could simply instruct someone to "write this sentence 100 times" and have it done automatically. That''s exactly what loops do for your code.

Loops are like having a tireless assistant who can repeat tasks without error. Whether you need to check every item in a shopping cart or display all the photos in an album, loops handle the repetition efficiently.

JavaScript provides several types of loops to choose from. Let''s examine each one and understand when to use them.

```mermaid
flowchart TD
    A["🔄 Loop Types"] --> B["For Loop"]
    A --> C["While Loop"]
    A --> D["For...of Loop"]
    A --> E["forEach Method"]
    
    B --> B1["Known iterations"]
    B --> B2["Counter-based"]
    B --> B3["for(init; condition; increment)"]
    
    C --> C1["Unknown iterations"]
    C --> C2["Condition-based"]
    C --> C3["while(condition)"]
    
    D --> D1["Modern ES6+"]
    D --> D2["Array iteration"]
    D --> D3["for(item of array)"]
    
    E --> E1["Functional style"]
    E --> E2["Array method"]
    E --> E3["array.forEach(callback)"]
    
    F["⏰ When to Use"] --> F1["For: Counting, indexes"]
    F --> F2["While: User input, searching"]
    F --> F3["For...of: Simple iteration"]
    F --> F4["forEach: Functional programming"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
    style F fill:#fce4ec
```

### For Loop

The `for` loop is like setting a timer - you know exactly how many times you want something to happen. It''s super organized and predictable, which makes it perfect when you''re working with arrays or need to count things.

**For Loop Structure:**

| Component | Purpose | Example |
|-----------|---------|----------|
| **Initialization** | Sets starting point | `let i = 0` |
| **Condition** | When to continue | `i  B["Initialize: let i = 0"]
    B --> C{"Condition: i |true| D["Execute code block"]
    D --> E["Increment: i++"]
    E --> C
    C -->|false| F["✅ Exit loop"]
    
    G["📋 Common Patterns"] --> G1["for(let i=0; i G2["for(let i=n-1; i>=0; i--)"]
    G --> G3["for(let i=0; i **Loop wisdom**: For loops are perfect when you know exactly how many times you need to repeat something. They''re the most common choice for array processing!

### While Loop

The `while` loop is like saying "keep doing this until..." - you might not know exactly how many times it''ll run, but you know when to stop. It''s perfect for things like asking a user for input until they give you what you need, or searching through data until you find what you''re looking for.

**While Loop Characteristics:**
- **Continues** executing as long as the condition is true
- **Requires** manual management of any counter variables
- **Checks** the condition before each iteration
- **Risks** infinite loops if the condition never becomes false

```javascript
// Basic counting example
let i = 0;
while (i = maxAttempts) {
  console.log("Maximum attempts reached!");
}
```

**Understanding these examples:**
- **Manages** the counter variable `i` manually inside the loop body
- **Increments** the counter to prevent infinite loops
- **Demonstrates** practical use case with user input and attempt limiting
- **Includes** safety mechanisms to prevent endless execution

### ♾️ **While Loop Wisdom Check: Condition-Based Repetition**

**Test your while loop comprehension:**
- What''s the main danger when using while loops?
- When would you choose a while loop over a for loop?
- How can you prevent infinite loops?

```mermaid
flowchart LR
    A["🔄 While vs For"] --> B["While Loop"]
    A --> C["For Loop"]
    
    B --> B1["Unknown iterations"]
    B --> B2["Condition-driven"]
    B --> B3["User input, searching"]
    B --> B4["⚠️ Risk: infinite loops"]
    
    C --> C1["Known iterations"]
    C --> C2["Counter-driven"]
    C --> C3["Array processing"]
    C --> C4["✅ Safe: predictable end"]
    
    D["🛡️ Safety Tips"] --> D1["Always modify condition variable"]
    D --> D2["Include escape conditions"]
    D --> D3["Set maximum iteration limits"]
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style D fill:#ffebee
```

> **Safety first**: While loops are powerful but require careful condition management. Always ensure your loop condition will eventually become false!

### Modern Loop Alternatives

JavaScript offers modern loop syntax that can make your code more readable and less error-prone.

**For...of Loop (ES6+):**

```javascript
const colors = ["red", "green", "blue", "yellow"];

// Modern approach - cleaner and safer
for (const color of colors) {
  console.log(`Color: ${color}`);
}

// Compare with traditional for loop
for (let i = 0; i  {
  console.log(`Item ${index + 1}: $${price.toFixed(2)}`);
});

// forEach with arrow functions for simple operations
prices.forEach(price => console.log(`Price: $${price}`));
```

**What you need to know about forEach:**
- **Executes** a function for each array element
- **Provides** both element value and index as parameters
- **Cannot** be stopped early (unlike traditional loops)
- **Returns** undefined (doesn''t create a new array)

✅ Why would you choose a for loop vs. a while loop? 17K viewers had the same question on StackOverflow, and some of the opinions might be interesting to you (https://stackoverflow.com/questions/39969145/while-loops-vs-for-loops-in-javascript).

### 🎨 **Modern Loop Syntax Check: Embracing ES6+**

**Assess your modern JavaScript understanding:**
- What are the advantages of `for...of` over traditional for loops?
- When might you still prefer traditional for loops?
- What''s the difference between `forEach` and `map`?

```mermaid
quadrantChart
    title Loop Selection Guide
    x-axis Traditional --> Modern
    y-axis Simple --> Complex
    quadrant-1 Modern Complex
    quadrant-2 Traditional Complex
    quadrant-3 Traditional Simple
    quadrant-4 Modern Simple
    
    Traditional For: [0.2, 0.7]
    While Loop: [0.3, 0.6]
    For...of: [0.8, 0.3]
    forEach: [0.9, 0.4]
    Array Methods: [0.8, 0.8]
```

> **Modern trend**: ES6+ syntax like `for...of` and `forEach` is becoming the preferred approach for array iteration because it''s cleaner and less error-prone!

## Loops and Arrays

Combining arrays with loops creates powerful data processing capabilities. This pairing is fundamental to many programming tasks, from displaying lists to calculating statistics.

**Traditional Array Processing:**

```javascript
const iceCreamFlavors = ["Chocolate", "Strawberry", "Vanilla", "Pistachio", "Rocky Road"];

// Classic for loop approach
for (let i = 0; i  highestGrade) {
    highestGrade = grade;
  }
  
  if (grade  B["🔄 Loop Processing"]
    B --> C["📈 Results"]
    
    A1["[85, 92, 78, 96, 88]"] --> A
    
    B --> B1["Calculate total"]
    B --> B2["Find min/max"]
    B --> B3["Count conditions"]
    B --> B4["Transform data"]
    
    C --> C1["Average: 87.8"]
    C --> C2["Highest: 96"]
    C --> C3["Passing: 5/5"]
    C --> C4["Letter grades"]
    
    D["⚡ Processing Patterns"] --> D1["Accumulation (sum)"]
    D --> D2["Comparison (min/max)"]
    D --> D3["Filtering (conditions)"]
    D --> D4["Mapping (transformation)"]
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style D fill:#f3e5f5
```

---

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Build a comprehensive data processing function that combines arrays and loops to analyze a dataset and generate meaningful insights.

**Prompt:** Create a function called `analyzeGrades` that takes an array of student grade objects (each containing name and score properties) and returns an object with statistics including the highest score, lowest score, average score, count of students who passed (score >= 70), and an array of student names who scored above average. Use at least two different loop types in your solution.

Learn more about agent mode (https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) here.

## 🚀 Challenge

JavaScript offers several modern array methods that can replace traditional loops for specific tasks. Explore forEach (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach), for-of (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for...of), map (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/map), filter (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/filter), and reduce (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce). 

**Your challenge:** Refactor the student grades example using at least three different array methods. Notice how much cleaner and more readable the code becomes with modern JavaScript syntax.

## Post-Lecture Quiz
Post-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/14)


## Review & Self Study

Arrays in JavaScript have many methods attached to them, that are extremely useful for data manipulation. Read up on these methods (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) and try some of them out (like push, pop, slice and splice) on an array of your creation.

## Assignment

Loop an Array (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/2-js-basics/4-arrays-loops/assignment.md)

---

## 📊 **Your Arrays & Loops Toolkit Summary**

```mermaid
graph TD
    A["🎯 Arrays & Loops Mastery"] --> B["📦 Array Fundamentals"]
    A --> C["🔄 Loop Types"]
    A --> D["🔗 Data Processing"]
    A --> E["🎨 Modern Techniques"]
    
    B --> B1["Creation: [ ]"]
    B --> B2["Indexing: arr[0]"]
    B --> B3["Methods: push, pop"]
    B --> B4["Properties: length"]
    
    C --> C1["For: Known iterations"]
    C --> C2["While: Condition-based"]
    C --> C3["For...of: Direct access"]
    C --> C4["forEach: Functional"]
    
    D --> D1["Statistics calculation"]
    D --> D2["Data transformation"]
    D --> D3["Filtering & searching"]
    D --> D4["Real-time processing"]
    
    E --> E1["Arrow functions"]
    E --> E2["Method chaining"]
    E --> E3["Destructuring"]
    E --> E4["Template literals"]
    
    F["💡 Key Benefits"] --> F1["Efficient data handling"]
    F --> F2["Reduced code repetition"]
    F --> F3["Scalable solutions"]
    F --> F4["Cleaner syntax"]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
    style F fill:#fce4ec
```

---

## 🚀 Your Arrays & Loops Mastery Timeline

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Create an array of your favorite movies and access specific elements
- [ ] Write a for loop that counts from 1 to 10
- [ ] Try the modern array methods challenge from the lesson
- [ ] Practice array indexing in your browser console

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and review any challenging concepts
- [ ] Build the comprehensive grade analyzer from the GitHub Copilot challenge
- [ ] Create a simple shopping cart that adds and removes items
- [ ] Practice converting between different loop types
- [ ] Experiment with array methods like `push`, `pop`, `slice`, and `splice`

### 📅 **Your Week-Long Data Processing Journey**
- [ ] Complete the "Loop an Array" assignment with creative enhancements
- [ ] Build a to-do list application using arrays and loops
- [ ] Create a simple statistics calculator for numerical data
- [ ] Practice with MDN array methods (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [ ] Build a photo gallery or music playlist interface
- [ ] Explore functional programming with `map`, `filter`, and `reduce`

### 🌟 **Your Month-Long Transformation**
- [ ] Master advanced array operations and performance optimization
- [ ] Build a complete data visualization dashboard
- [ ] Contribute to open source projects involving data processing
- [ ] Teach someone else about arrays and loops with practical examples
- [ ] Create a personal library of reusable data processing functions
- [ ] Explore algorithms and data structures built on arrays

### 🏆 **Final Data Processing Champion Check-in**

**Celebrate your array and loop mastery:**
- What''s the most useful array operation you''ve learned for real-world applications?
- Which loop type feels most natural to you and why?
- How has understanding arrays and loops changed your approach to organizing data?
- What complex data processing task would you like to tackle next?

```mermaid
journey
    title Your Data Processing Evolution
    section Today
      Array Confusion: 3: You
      Loop Basics: 4: You
      Index Understanding: 5: You
    section This Week
      Method Mastery: 4: You
      Efficient Processing: 5: You
      Modern Syntax: 5: You
    section Next Month
      Complex Algorithms: 5: You
      Performance Optimization: 5: You
      Teaching Others: 5: You
```

> 📦 **You''ve unlocked the power of data organization and processing!** Arrays and loops are the foundation of almost every application you''ll ever build. From simple lists to complex data analysis, you now have the tools to handle information efficiently and elegantly. Every dynamic website, mobile app, and data-driven application relies on these fundamental concepts. Welcome to the world of scalable data processing! 🎉',16);
update public.books set status='APPROVED',published_at=now() where id=b;end if;
if not exists(select 1 from public.books where slug='web-development-foundations') then
insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values('web-development-foundations','Web Development Foundations','Microsoft and curriculum contributors','A chapter-based reading guide adapted from the openly licensed Web-Dev-For-Beginners curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.','Web Development','English','https://github.com/microsoft/Web-Dev-For-Beginners/tree/78085398be0dea7abaaf5eda914817f46f6ddbbc','MIT','https://github.com/microsoft/Web-Dev-For-Beginners/blob/78085398be0dea7abaaf5eda914817f46f6ddbbc/LICENSE','    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
','Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained. This is a reading adaptation, not a complete standalone edition.','https://github.com/microsoft/Web-Dev-For-Beginners/blob/78085398be0dea7abaaf5eda914817f46f6ddbbc/LICENSE','Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.',true,true,144) returning id into b;
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'web-development-foundations-1','Introduction to Programming Languages and Modern Developer Tools',1,'# Introduction to Programming Languages and Modern Developer Tools
 
Hey there, future developer! 👋 Can I tell you something that still gives me chills every single day? You''re about to discover that programming isn''t just about computers – it''s about having actual superpowers to bring your wildest ideas to life!

You know that moment when you''re using your favorite app and everything just clicks perfectly? When you tap a button and something absolutely magical happens that makes you go "wow, how did they DO that?" Well, someone just like you – probably sitting in their favorite coffee shop at 2 AM with their third espresso – wrote the code that created that magic. And here''s what''s going to blow your mind: by the end of this lesson, you''ll not only understand how they did it, but you''ll be itching to try it yourself!

Look, I totally get it if programming feels intimidating right now. When I first started, I honestly thought you needed to be some kind of math genius or have been coding since you were five years old. But here''s what completely changed my perspective: programming is exactly like learning to have conversations in a new language. You start with "hello" and "thank you," then work up to ordering coffee, and before you know it, you''re having deep philosophical discussions! Except in this case, you''re having conversations with computers, and honestly? They''re the most patient conversation partners you''ll ever have – they never judge your mistakes and they''re always excited to try again!

Today, we''re going to explore the incredible tools that make modern web development not just possible, but seriously addictive. I''m talking about the exact same editors, browsers, and workflows that developers at Netflix, Spotify, and your favorite indie app studio use every single day. And here''s the part that''s going to make you do a happy dance: most of these professional-grade, industry-standard tools are completely free!


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

```mermaid
journey
    title Your Programming Journey Today
    section Discover
      What is Programming: 5: You
      Programming Languages: 4: You
      Tools Overview: 5: You
    section Explore
      Code Editors: 4: You
      Browsers & DevTools: 5: You
      Command Line: 3: You
    section Practice
      Language Detective: 4: You
      Tool Exploration: 5: You
      Community Connection: 5: You
```

## Let''s See What You Already Know!

Before we jump into the fun stuff, I''m curious – what do you already know about this programming world? And listen, if you''re looking at these questions thinking "I literally have zero clue about any of this," that''s not just okay, it''s perfect! That means you''re in exactly the right place. Think of this quiz like stretching before a workout – we''re just warming up those brain muscles!

Take the pre-lesson quiz (https://ff-quizzes.netlify.app/web/)


## The Adventure We''re About to Go On Together

Okay, I am genuinely bouncing with excitement about what we''re going to explore today! Seriously, I wish I could see your face when some of these concepts click. Here''s the incredible journey we''re taking together:

- **What programming actually is (and why it''s the coolest thing ever!)** – We''re going to discover how code is literally the invisible magic powering everything around you, from that alarm that somehow knows it''s Monday morning to the algorithm that perfectly curates your Netflix recommendations
- **Programming languages and their amazing personalities** – Imagine walking into a party where each person has completely different superpowers and ways of solving problems. That''s what the programming language world is like, and you''re going to love meeting them!
- **The fundamental building blocks that make digital magic happen** – Think of these as the ultimate creative LEGO set. Once you understand how these pieces fit together, you''ll realize you can literally build anything your imagination dreams up
- **Professional tools that''ll make you feel like you just got handed a wizard''s wand** – I''m not being dramatic here – these tools will genuinely make you feel like you have superpowers, and the best part? They''re the same ones the pros use!

> 💡 **Here''s the thing**: Don''t even think about trying to memorize everything today! Right now, I just want you to feel that spark of excitement about what''s possible. The details will stick naturally as we practice together – that''s how real learning happens!

> You can take this lesson on Microsoft Learn (https://learn.microsoft.com/en-us/learn/modules/web-development-101/introduction-programming/?WT.mc_id=academic-77807-sagibbon)!

## So What Exactly *Is* Programming?

Alright, let''s tackle the million-dollar question: what is programming, really?

I''ll give you a story that completely changed how I think about this. Last week, I was trying to explain to my mom how to use our new smart TV remote. I caught myself saying things like "Press the red button, but not the big red button, the small red button on the left... no, your other left... okay, now hold it for two seconds, not one, not three..." Sound familiar? 😅

That''s programming! It''s the art of giving incredibly detailed, step-by-step instructions to something that''s very powerful but needs everything spelled out perfectly. Except instead of explaining to your mom (who can ask "which red button?!"), you''re explaining to a computer (which just does exactly what you say, even if what you said isn''t quite what you meant).

Here''s what blew my mind when I first learned this: computers are actually pretty simple at their core. They literally only understand two things – 1 and 0, which is basically just "yes" and "no" or "on" and "off." That''s it! But here''s where it gets magical – we don''t have to speak in 1s and 0s like we''re in The Matrix. That''s where **programming languages** come to the rescue. They''re like having the world''s best translator who takes your perfectly normal human thoughts and converts them into computer language.

And here''s what still gives me actual chills every morning when I wake up: literally *everything* digital in your life started with someone just like you, probably sitting in their pajamas with a cup of coffee, typing code on their laptop. That Instagram filter that makes you look flawless? Someone coded that. The recommendation that led you to your new favorite song? A developer built that algorithm. The app that helps you split dinner bills with friends? Yep, someone thought "this is annoying, I bet I could fix this" and then... they did!

When you learn to program, you''re not just picking up a new skill – you''re becoming part of this incredible community of problem-solvers who spend their days thinking, "What if I could build something that makes someone''s day just a little bit better?" Honestly, is there anything cooler than that?

✅ **Fun Fact Hunt**: Here''s something super cool to look up when you have a spare moment – who do you think was the world''s first computer programmer? I''ll give you a hint: it might not be who you''re expecting! The story behind this person is absolutely fascinating and shows that programming has always been about creative problem-solving and thinking outside the box.

### 🧠 **Check-in Time: How Are You Feeling?**

**Take a moment to reflect:**
- Does the idea of "giving instructions to computers" make sense to you now?
- Can you think of a daily task you''d like to automate with programming?
- What questions are bubbling up in your mind about this whole programming thing?

> **Remember**: It''s totally normal if some concepts feel fuzzy right now. Learning programming is like learning a new language – it takes time for your brain to build those neural pathways. You''re doing great!

## Programming Languages Are Like Different Flavors of Magic

Okay, this is going to sound weird, but stick with me – programming languages are a lot like different types of music. Think about it: you''ve got jazz, which is smooth and improvisational, rock that''s powerful and straightforward, classical that''s elegant and structured, and hip-hop that''s creative and expressive. Each style has its own vibe, its own community of passionate fans, and each one is perfect for different moods and occasions.

Programming languages work exactly the same way! You wouldn''t use the same language to build a fun mobile game that you''d use to crunch massive amounts of climate data, just like you wouldn''t play death metal at a yoga class (well, most yoga classes anyway! 😄).

But here''s what absolutely blows my mind every time I think about it: these languages are like having the most patient, brilliant interpreter in the world sitting right next to you. You can express your ideas in a way that feels natural to your human brain, and they handle all the incredibly complex work of translating that into the 1s and 0s that computers actually speak. It''s like having a friend who''s perfectly fluent in both "human creativity" and "computer logic" – and they never get tired, never need coffee breaks, and never judge you for asking the same question twice!

### Popular Programming Languages and Their Uses

```mermaid
mindmap
  root((Programming Languages))
    Web Development
      JavaScript
        Frontend Magic
        Interactive Websites
      TypeScript
        JavaScript + Types
        Enterprise Apps
    Data & AI
      Python
        Data Science
        Machine Learning
        Automation
      R
        Statistics
        Research
    Mobile Apps
      Java
        Android
        Enterprise
      Swift
        iOS
        Apple Ecosystem
      Kotlin
        Modern Android
        Cross-platform
    Systems & Performance
      C++
        Games
        Performance Critical
      Rust
        Memory Safety
        System Programming
      Go
        Cloud Services
        Scalable Backend
```

| Language | Best For | Why It''s Popular |
|----------|----------|------------------|
| **JavaScript** | Web development, user interfaces | Runs in browsers and powers interactive websites |
| **Python** | Data science, automation, AI | Easy to read and learn, powerful libraries |
| **Java** | Enterprise applications, Android apps | Platform-independent, robust for large systems |
| **C#** | Windows applications, game development | Strong Microsoft ecosystem support |
| **Go** | Cloud services, backend systems | Fast, simple, designed for modern computing |

### High-Level vs. Low-Level Languages

Okay, this was honestly the concept that broke my brain when I first started learning, so I''m going to share the analogy that finally made it click for me – and I really hope it helps you too!

Imagine you''re visiting a country where you don''t speak the language, and you desperately need to find the nearest bathroom (we''ve all been there, right? 😅):

- **Low-level programming** is like learning the local dialect so well that you can chat with the grandmother selling fruit on the corner using cultural references, local slang, and inside jokes that only someone who grew up there would understand. Super impressive and incredibly efficient... if you happen to be fluent! But pretty overwhelming when you''re just trying to find a bathroom.

- **High-level programming** is like having that amazing local friend who just gets you. You can say "I really need to find a restroom" in plain English, and they handle all the cultural translation and give you directions in a way that makes perfect sense to your non-local brain.

In programming terms:
- **Low-level languages** (like Assembly or C) let you have incredibly detailed conversations with the computer''s actual hardware, but you need to think like a machine, which is... well, let''s just say it''s a pretty big mental shift!
- **High-level languages** (like JavaScript, Python, or C#) let you think like a human while they handle all the machine-speak behind the scenes. Plus, they have these incredibly welcoming communities full of people who remember what it was like to be new and genuinely want to help!

Guess which ones I''m going to suggest you start with? 😉 High-level languages are like having training wheels that you never actually want to take off because they make the whole experience so much more enjoyable!

```mermaid
flowchart TB
    A["👤 Human Thought:''I want to calculate Fibonacci numbers''"] --> B{Choose Language Level}
    
    B -->|High-Level| C["🌟 JavaScript/PythonEasy to read and write"]
    B -->|Low-Level| D["⚙️ Assembly/CDirect hardware control"]
    
    C --> E["📝 Write: fibonacci(10)"]
    D --> F["📝 Write: mov r0,#00sub r0,r0,#01"]
    
    E --> G["🤖 Computer Understanding:Translator handles complexity"]
    F --> G
    
    G --> H["💻 Same Result:0, 1, 1, 2, 3, 5, 8, 13..."]
    
    style C fill:#e1f5fe
    style D fill:#fff3e0
    style H fill:#e8f5e8
```

### Let Me Show You Why High-Level Languages Are So Much Friendlier

Alright, I''m about to show you something that perfectly demonstrates why I fell in love with high-level languages, but first – I need you to promise me something. When you see that first code example, don''t panic! It''s supposed to look intimidating. That''s exactly the point I''m making!

We''re going to look at the exact same task written in two completely different styles. Both create what''s called the Fibonacci sequence – it''s this beautiful mathematical pattern where each number is the sum of the two before it: 0, 1, 1, 2, 3, 5, 8, 13... (Fun fact: you''ll find this pattern literally everywhere in nature – sunflower seed spirals, pinecone patterns, even the way galaxies form!)

Ready to see the difference? Let''s go!

**High-level language (JavaScript) – Human-friendly:**

```javascript
// Step 1: Basic Fibonacci setup
const fibonacciCount = 10;
let current = 0;
let next = 1;

console.log(''Fibonacci sequence:'');
```

**Here''s what this code does:**
- **Declare** a constant to specify how many Fibonacci numbers we want to generate
- **Initialize** two variables to track the current and next numbers in the sequence
- **Set up** the starting values (0 and 1) that define the Fibonacci pattern
- **Display** a header message to identify our output

```javascript
// Step 2: Generate the sequence with a loop
for (let i = 0; i  {
  const sequence = [0, 1];
  
  for (let i = 2; i = 18) {
  console.log("You can vote!");
} else {
  const yearsToWait = 18 - userAge;
  console.log(`You''ll be able to vote in ${yearsToWait} year(s).`);
}
```

**Here''s what this code does:**
- **Check** if the user''s age meets the voting requirement
- **Execute** different code blocks based on the condition result
- **Calculate** and display how long until voting eligibility if under 18
- **Provide** specific, helpful feedback for each scenario

```javascript
// Step 2: Multiple conditions with logical operators
const userAge = 17;
const hasPermission = true;

if (userAge >= 18 && hasPermission) {
  console.log("Access granted: You can enter the venue.");
} else if (userAge >= 16) {
  console.log("You need parent permission to enter.");
} else {
  console.log("Sorry, you must be at least 16 years old.");
}
```

**Breaking down what happens here:**
- **Combine** multiple conditions using the `&&` (and) operator
- **Create** a hierarchy of conditions using `else if` for multiple scenarios
- **Handle** all possible cases with a final `else` statement
- **Provide** clear, actionable feedback for each different situation

```javascript
// Step 3: Concise conditional with ternary operator
const votingStatus = userAge >= 18 ? "Can vote" : "Cannot vote yet";
console.log(`Status: ${votingStatus}`);
```

**What you need to remember:**
- **Use** the ternary operator (`? :`) for simple two-option conditions
- **Write** condition first, followed by `?`, then true result, then `:`, then false result
- **Apply** this pattern when you need to assign values based on conditions

```javascript
// Step 4: Handling multiple specific cases
const dayOfWeek = "Tuesday";

switch (dayOfWeek) {
  case "Monday":
  case "Tuesday":
  case "Wednesday":
  case "Thursday":
  case "Friday":
    console.log("It''s a weekday - time to work!");
    break;
  case "Saturday":
  case "Sunday":
    console.log("It''s the weekend - time to relax!");
    break;
  default:
    console.log("Invalid day of the week");
}
```

**This code accomplishes the following:**
- **Match** the variable value against multiple specific cases
- **Group** similar cases together (weekdays vs. weekends)
- **Execute** the appropriate code block when a match is found
- **Include** a `default` case to handle unexpected values
- **Use** `break` statements to prevent code from continuing to the next case

> 💡 **Real-world analogy**: Think of control flow like having the world''s most patient GPS giving you directions. It might say "If there''s traffic on Main Street, take the highway instead. If construction is blocking the highway, try the scenic route." Programs use exactly the same type of conditional logic to respond intelligently to different situations and always give users the best possible experience.

### 🎯 **Concept Check: Building Blocks Mastery**

**Let''s see how you''re doing with the fundamentals:**
- Can you explain the difference between a variable and a statement in your own words?
- Think of a real-world scenario where you''d use an if-then decision (like our voting example)
- What''s one thing about programming logic that surprised you?

**Quick confidence booster:**
```mermaid
flowchart LR
    A["📝 Statements(Instructions)"] --> B["📦 Variables(Storage)"] --> C["🔀 Control Flow(Decisions)"] --> D["🎉 Working Program!"]
    
    style A fill:#ffeb3b
    style B fill:#4caf50
    style C fill:#2196f3
    style D fill:#ff4081
```

✅ **What''s coming up next**: We''re going to have an absolute blast diving deeper into these concepts as we continue this incredible journey together! Right now, just focus on feeling that excitement about all the amazing possibilities ahead of you. The specific skills and techniques will stick naturally as we practice together – I promise this is going to be so much more fun than you might expect!

## Tools of the Trade

Alright, this is honestly where I get so excited I can barely contain myself! 🚀 We''re about to talk about the incredible tools that are going to make you feel like you just got handed the keys to a digital spaceship.

You know how a chef has those perfectly balanced knives that feel like extensions of their hands? Or how a musician has that one guitar that seems to sing the moment they touch it? Well, developers have our own version of these magical tools, and here''s what''s going to absolutely blow your mind – most of them are completely free!

I''m practically bouncing in my chair thinking about sharing these with you because they''ve completely revolutionized how we build software. We''re talking about AI-powered coding assistants that can help write your code (I''m not even kidding!), cloud environments where you can build entire applications from literally anywhere with Wi-Fi, and debugging tools so sophisticated they''re like having X-ray vision for your programs.

And here''s the part that still gives me chills: these aren''t "beginner tools" that you''ll outgrow. These are the exact same professional-grade tools that developers at Google, Netflix, and that indie app studio you love are using right this very moment. You''re going to feel like such a pro using them!

```mermaid
graph TD
    A["💡 Your Idea"] --> B["⌨️ Code Editor(VS Code)"] 
    B --> C["🌐 Browser DevTools(Testing & Debugging)"]
    C --> D["⚡ Command Line(Automation & Tools)"]
    D --> E["📚 Documentation(Learning & Reference)"]
    E --> F["🚀 Amazing Web App!"]
    
    B -.-> G["🤖 AI Assistant(GitHub Copilot)"]
    C -.-> H["📱 Device Testing(Responsive Design)"]
    D -.-> I["📦 Package Managers(npm, yarn)"]
    E -.-> J["👥 Community(Stack Overflow)"]
    
    style A fill:#fff59d
    style F fill:#c8e6c9
    style G fill:#e1f5fe
    style H fill:#f3e5f5
    style I fill:#ffccbc
    style J fill:#e8eaf6
```

### Code Editors and IDEs: Your New Digital Best Friends

Let''s talk about code editors – these are seriously about to become your new favorite places to hang out! Think of them as your personal coding sanctuary where you''ll spend most of your time crafting and perfecting your digital creations.

But here''s what''s absolutely magical about modern editors: they''re not just fancy text editors. They''re like having the most brilliant, supportive coding mentor sitting right next to you 24/7. They catch your typos before you even notice them, suggest improvements that make you look like a genius, help you understand what every piece of code does, and some of them can even predict what you''re about to type and offer to finish your thoughts!

I remember when I first discovered auto-completion – I literally felt like I was living in the future. You start typing something, and your editor goes, "Hey, were you thinking of this function that does exactly what you need?" It''s like having a mind reader as your coding buddy!

**What makes these editors so incredible?**

Modern code editors offer an impressive array of features designed to boost your productivity:

| Feature | What It Does | Why It Helps |
|---------|--------------|--------------|
| **Syntax Highlighting** | Colors different parts of your code | Makes code easier to read and spot errors |
| **Auto-completion** | Suggests code as you type | Speeds up coding and reduces typos |
| **Debugging Tools** | Helps you find and fix errors | Saves hours of troubleshooting time |
| **Extensions** | Add specialized features | Customize your editor for any technology |
| **AI Assistants** | Suggest code and explanations | Accelerates learning and productivity |

> 🎥 **Video Resource**: Want to see these tools in action? Check out this Tools of the Trade video (https://youtube.com/watch?v=69WJeXGBdxg) for a comprehensive overview.

#### Recommended Editors for Web Development

**Visual Studio Code (https://code.visualstudio.com/?WT.mc_id=academic-77807-sagibbon)** (Free)
- Most popular among web developers
- Excellent extension ecosystem
- Built-in terminal and Git integration
- **Must-have extensions**:
  - GitHub Copilot (https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) - AI-powered code suggestions
  - Live Share (https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare) - Real-time collaboration
  - Prettier (https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - Automatic code formatting
  - Code Spell Checker (https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) - Catch typos in your code

**JetBrains WebStorm (https://www.jetbrains.com/webstorm/)** (Paid, free for students)
- Advanced debugging and testing tools
- Intelligent code completion
- Built-in version control

**Cloud-Based IDEs** (Various pricing)
- GitHub Codespaces (https://github.com/features/codespaces) - Full VS Code in your browser
- Replit (https://replit.com/) - Great for learning and sharing code
- StackBlitz (https://stackblitz.com/) - Instant, full-stack web development

> 💡 **Getting Started Tip**: Start with Visual Studio Code – it''s free, widely used in the industry, and has an enormous community creating helpful tutorials and extensions.


### Web Browsers: Your Secret Development Laboratory

Okay, prepare to have your mind completely blown! You know how you''ve been using browsers to scroll through social media and watch videos? Well, it turns out they''ve been hiding this incredible secret developer laboratory this entire time, just waiting for you to discover it!

Every single time you right-click on a webpage and select "Inspect Element," you''re opening up a hidden world of developer tools that are honestly more powerful than some expensive software I used to pay hundreds of dollars for. It''s like discovering that your regular old kitchen has been concealing a professional chef''s laboratory behind a secret panel!

The first time someone showed me browser DevTools, I spent like three hours just clicking around and going "WAIT, IT CAN DO THAT TOO?!" You can literally edit any website in real-time, see exactly how fast everything loads, test how your site looks on different devices, and even debug JavaScript like a total pro. It''s absolutely mind-blowing!

**Here''s why browsers are your secret weapon:**

When you create a website or web application, you need to see how it looks and behaves in the real world. Browsers not only display your work but also provide detailed feedback about performance, accessibility, and potential issues.

#### Browser Developer Tools (DevTools)

Modern browsers include comprehensive development suites:

| Tool Category | What It Does | Example Use Case |
|---------------|--------------|------------------|
| **Element Inspector** | View and edit HTML/CSS in real-time | Adjust styling to see immediate results |
| **Console** | View error messages and test JavaScript | Debug problems and experiment with code |
| **Network Monitor** | Track how resources load | Optimize performance and loading times |
| **Accessibility Checker** | Test for inclusive design | Ensure your site works for all users |
| **Device Simulator** | Preview on different screen sizes | Test responsive design without multiple devices |

#### Recommended Browsers for Development

- **Chrome (https://developers.google.com/web/tools/chrome-devtools/)** - Industry-standard DevTools with extensive documentation
- **Firefox (https://developer.mozilla.org/docs/Tools)** - Excellent CSS Grid and accessibility tools
- **Edge (https://docs.microsoft.com/microsoft-edge/devtools-guide-chromium/?WT.mc_id=academic-77807-sagibbon)** - Built on Chromium with Microsoft''s developer resources

> ⚠️ **Important Testing Tip**: Always test your websites in multiple browsers! What works perfectly in Chrome might look different in Safari or Firefox. Professional developers test across all major browsers to ensure consistent user experiences.


### Command Line Tools: Your Gateway to Developer Superpowers

Alright, let''s have a completely honest moment here about the command line, because I want you to hear this from someone who truly gets it. When I first saw it – just this scary black screen with blinking text – I literally thought, "Nope, absolutely not! This looks like something from a 1980s hacker movie, and I am definitely not smart enough for this!" 😅

But here''s what I wish someone had told me back then, and what I''m telling you right now: the command line isn''t scary – it''s actually like having a direct conversation with your computer. Think of it like the difference between ordering food through a fancy app with pictures and menus (which is nice and easy) versus walking into your favorite local restaurant where the chef knows exactly what you like and can whip up something perfect just by you saying "surprise me with something amazing."

The command line is where developers go to feel like absolute wizards. You type a few seemingly magical words (okay, they''re just commands, but they feel magical!), hit enter, and BOOM – you''ve created entire project structures, installed powerful tools from around the world, or deployed your app to the internet for millions of people to see. Once you get your first taste of that power, it''s honestly pretty addictive!

**Why the command line will become your favorite tool:**

While graphical interfaces are great for many tasks, the command line excels at automation, precision, and speed. Many development tools work primarily through command line interfaces, and learning to use them efficiently can dramatically improve your productivity.

```bash
# Step 1: Create and navigate to project directory
mkdir my-awesome-website
cd my-awesome-website
```

**Here''s what this code does:**
- **Create** a new directory called "my-awesome-website" for your project
- **Navigate** into the newly created directory to begin working

```bash
# Step 2: Initialize project with package.json
npm init -y

# Install modern development tools
npm install --save-dev vite prettier eslint
npm install --save-dev @eslint/js
```

**Step by step, here''s what''s happening:**
- **Initialize** a new Node.js project with default settings using `npm init -y`
- **Install** Vite as a modern build tool for fast development and production builds
- **Add** Prettier for automatic code formatting and ESLint for code quality checks
- **Use** the `--save-dev` flag to mark these as development-only dependencies

```bash
# Step 3: Create project structure and files
mkdir src assets
echo ''My SiteHello World'' > index.html

# Start development server
npx vite
```

**In the above, we''ve:**
- **Organized** our project by creating separate folders for source code and assets
- **Generated** a basic HTML file with proper document structure
- **Started** the Vite development server for live reloading and hot module replacement

#### Essential Command Line Tools for Web Development

| Tool | Purpose | Why You Need It |
|------|---------|-----------------|
| **Git (https://git-scm.com/)** | Version control | Track changes, collaborate with others, backup your work |
| **Node.js & npm (https://nodejs.org/)** | JavaScript runtime & package management | Run JavaScript outside browsers, install modern development tools |
| **Vite (https://vitejs.dev/)** | Build tool & dev server | Lightning-fast development with hot module replacement |
| **ESLint (https://eslint.org/)** | Code quality | Automatically find and fix problems in your JavaScript |
| **Prettier (https://prettier.io/)** | Code formatting | Keep your code consistently formatted and readable |

#### Platform-Specific Options

**Windows:**
- **Windows Terminal (https://docs.microsoft.com/windows/terminal/?WT.mc_id=academic-77807-sagibbon)** - Modern, feature-rich terminal
- **PowerShell (https://docs.microsoft.com/powershell/?WT.mc_id=academic-77807-sagibbon)** 💻 - Powerful scripting environment
- **Command Prompt (https://learn.microsoft.com/windows-server/administration/windows-commands/windows-commands)** 💻 - Traditional Windows command line

**macOS:**
- **Terminal (https://support.apple.com/guide/terminal/)** 💻 - Built-in terminal application
- **iTerm2 (https://iterm2.com/)** - Enhanced terminal with advanced features

**Linux:**
- **Bash (https://www.gnu.org/software/bash/)** 💻 - Standard Linux shell
- **KDE Konsole (https://docs.kde.org/trunk5/en/konsole/konsole/index.html)** - Advanced terminal emulator

> 💻 = Pre-installed on the operating system

> 🎯 **Learning Path**: Start with basic commands like `cd` (change directory), `ls` or `dir` (list files), and `mkdir` (create folder). Practice with modern workflow commands like `npm install`, `git status`, and `code .` (opens current directory in VS Code). As you become more comfortable, you''ll naturally pick up more advanced commands and automation techniques.


### Documentation: Your Always-Available Learning Mentor

Okay, let me share a little secret that''s going to make you feel so much better about being a beginner: even the most experienced developers spend a huge chunk of their time reading documentation. And that''s not because they don''t know what they''re doing – it''s actually a sign of wisdom!

Think of documentation as having access to the world''s most patient, knowledgeable teachers who are available 24/7. Stuck on a problem at 2 AM? Documentation is there with a warm virtual hug and exactly the answer you need. Want to learn about some cool new feature that everyone''s talking about? Documentation has your back with step-by-step examples. Trying to understand why something works the way it does? You guessed it – documentation is ready to explain it in a way that finally makes it click!

Here''s something that completely changed my perspective: the web development world moves incredibly fast, and nobody (I mean absolutely nobody!) keeps everything memorized. I''ve watched senior developers with 15+ years of experience look up basic syntax, and you know what? That''s not embarrassing – that''s smart! It''s not about having a perfect memory; it''s about knowing where to find reliable answers quickly and understanding how to apply them.

**Here''s where the real magic happens:**

Professional developers spend a significant portion of their time reading documentation – not because they don''t know what they''re doing, but because the web development landscape evolves so rapidly that staying current requires continuous learning. Great documentation helps you understand not just *how* to use something, but *why* and *when* to use it.

#### Essential Documentation Resources

**Mozilla Developer Network (MDN) (https://developer.mozilla.org/docs/Web)**
- The gold standard for web technology documentation
- Comprehensive guides for HTML, CSS, and JavaScript
- Includes browser compatibility information
- Features practical examples and interactive demos

**Web.dev (https://web.dev/)** (by Google)
- Modern web development best practices
- Performance optimization guides
- Accessibility and inclusive design principles
- Case studies from real-world projects

**Microsoft Developer Documentation (https://docs.microsoft.com/microsoft-edge/#microsoft-edge-for-developers)**
- Edge browser development resources
- Progressive Web App guides
- Cross-platform development insights

**Frontend Masters Learning Paths (https://frontendmasters.com/learn/)**
- Structured learning curricula
- Video courses from industry experts
- Hands-on coding exercises

> 📚 **Study Strategy**: Don''t try to memorize documentation – instead, learn how to navigate it efficiently. Bookmark frequently-used references and practice using the search functions to find specific information quickly.

### 🔧 **Tool Mastery Check: What Resonates With You?**

**Take a moment to consider:**
- Which tool are you most excited to try first? (There''s no wrong answer!)
- Does the command line still feel intimidating, or are you curious about it?
- Can you imagine using browser DevTools to peek behind the curtain of your favorite websites?

```mermaid
pie title "Developer Time Spent With Tools"
    "Code Editor" : 40
    "Browser Testing" : 25
    "Command Line" : 15
    "Reading Docs" : 15
    "Debugging" : 5
```

> **Fun insight**: Most developers spend about 40% of their time in their code editor, but notice how much time goes to testing, learning, and problem-solving. Programming isn''t just about writing code – it''s about crafting experiences!

✅ **Food for thought**: Here''s something interesting to ponder – how do you think the tools for building websites (development) might be different from tools for designing how they look (design)? It''s like the difference between being an architect who designs a beautiful house and the contractor who actually builds it. Both are crucial, but they need different toolboxes! This kind of thinking will really help you see the bigger picture of how websites come to life.

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Explore the features of a modern code editor or IDE and demonstrate how it can improve your workflow as a web developer.

**Prompt:** Choose a code editor or IDE (such as Visual Studio Code, WebStorm, or a cloud-based IDE). List three features or extensions that help you write, debug, or maintain code more efficiently. For each, provide a brief explanation of how it benefits your workflow.

---

## 🚀 Challenge

**Alright, detective, ready for your first case?**

Now that you''ve got this awesome foundation, I''ve got an adventure that''s going to help you see just how incredibly diverse and fascinating the programming world really is. And listen – this isn''t about writing code yet, so no pressure there! Think of yourself as a programming language detective on your very first exciting case!

**Your mission, should you choose to accept it:**
1. **Become a language explorer**: Pick three programming languages from completely different universes – maybe one that builds websites, one that creates mobile apps, and one that crunches data for scientists. Find examples of the same simple task written in each language. I promise you''re going to be absolutely amazed at how different they can look while doing the exact same thing!

2. **Uncover their origin stories**: What makes each language special? Here''s a cool fact – every single programming language was created because someone thought, "You know what? There''s got to be a better way to solve this specific problem." Can you figure out what those problems were? Some of these stories are genuinely fascinating!

3. **Meet the communities**: Check out how welcoming and passionate each language''s community is. Some have millions of developers sharing knowledge and helping each other, others are smaller but incredibly tight-knit and supportive. You''re going to love seeing the different personalities these communities have!

4. **Follow your gut feeling**: Which language feels most approachable to you right now? Don''t stress about making the "perfect" choice – just listen to your instincts! There''s honestly no wrong answer here, and you can always explore others later.

**Bonus detective work**: See if you can discover what major websites or apps are built with each language. I guarantee you''ll be shocked to learn what powers Instagram, Netflix, or that mobile game you can''t stop playing!

> 💡 **Remember**: You''re not trying to become an expert in any of these languages today. You''re just getting to know the neighborhood before you decide where you want to set up shop. Take your time, have fun with it, and let your curiosity guide you!

## Let''s Celebrate What You''ve Discovered!

Holy moly, you''ve absorbed so much incredible information today! I''m genuinely excited to see how much of this amazing journey has stuck with you. And remember – this isn''t a test where you need to get everything perfect. This is more like a celebration of all the cool stuff you''ve learned about this fascinating world you''re about to dive into!

Take the post-lesson quiz (https://ff-quizzes.netlify.app/web/)

## Review & Self Study

**Take your time to explore and have fun with it!**

You''ve covered a lot of ground today, and that''s something to be proud of! Now comes the fun part – exploring the topics that sparked your curiosity. Remember, this isn''t homework – it''s an adventure!

**Dive deeper into what excites you:**

**Get hands-on with programming languages:**
- Visit the official websites of 2-3 languages that caught your attention. Each one has its own personality and story!
- Try some online coding playgrounds like CodePen (https://codepen.io/), JSFiddle (https://jsfiddle.net/), or Replit (https://replit.com/). Don''t be afraid to experiment – you can''t break anything!
- Read about how your favorite language came to be. Seriously, some of these origin stories are fascinating and will help you understand why languages work the way they do.

**Get comfortable with your new tools:**
- Download Visual Studio Code if you haven''t already – it''s free and you''re going to love it!
- Spend a few minutes browsing the Extensions marketplace. It''s like an app store for your code editor!
- Open up your browser''s Developer Tools and just click around. Don''t worry about understanding everything – just get familiar with what''s there.

**Join the community:**
- Follow some developer communities on Dev.to (https://dev.to/), Stack Overflow (https://stackoverflow.com/), or GitHub (https://github.com/). The programming community is incredibly welcoming to newcomers!
- Watch some beginner-friendly coding videos on YouTube. There are so many great creators out there who remember what it''s like to be starting out.
- Consider joining local meetups or online communities. Trust me, developers love helping newcomers!

> 🎯 **Listen, here''s what I want you to remember**: You''re not expected to become a coding wizard overnight! Right now, you''re just getting to know this amazing new world you''re about to be part of. Take your time, enjoy the journey, and remember – every single developer you admire was once sitting exactly where you are right now, feeling excited and maybe a little overwhelmed. That''s totally normal, and it means you''re doing it right!



## Assignment

Reading the Docs (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/1-getting-started-lessons/1-intro-to-programming-languages/assignment.md)

> 💡 **A little nudge for your assignment**: I''d absolutely love to see you explore some tools we haven''t covered yet! Skip the editors, browsers, and command line tools we''ve already talked about – there''s this whole incredible universe of amazing development tools out there just waiting to be discovered. Look for ones that are actively maintained and have vibrant, helpful communities (these tend to have the best tutorials and the most supportive people when you inevitably get stuck and need a friendly hand).

---

## 🚀 Your Programming Journey Timeline

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Bookmark 2-3 programming language websites that caught your attention
- [ ] Download Visual Studio Code if you haven''t already
- [ ] Open your browser''s DevTools (F12) and click around any website
- [ ] Join one programming community (Dev.to, Reddit r/webdev, or Stack Overflow)

### ⏰ **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and reflect on your answers
- [ ] Set up VS Code with the GitHub Copilot extension
- [ ] Try a "Hello World" example in 2 different programming languages online
- [ ] Watch a "Day in the Life of a Developer" video on YouTube
- [ ] Start your programming language detective work (from the challenge)

### 📅 **Your Week-Long Adventure**
- [ ] Complete the assignment and explore 3 new development tools
- [ ] Follow 5 developers or programming accounts on social media
- [ ] Try building something tiny in CodePen or Replit (even just "Hello, [Your Name]!")
- [ ] Read one developer blog post about someone''s coding journey
- [ ] Join a virtual meetup or watch a programming talk
- [ ] Start learning your chosen language with online tutorials

### 🗓️ **Your Month-Long Transformation**
- [ ] Build your first small project (even a simple webpage counts!)
- [ ] Contribute to an open-source project (start with documentation fixes)
- [ ] Mentor someone who''s just starting their programming journey
- [ ] Create your developer portfolio website
- [ ] Connect with local developer communities or study groups
- [ ] Start planning your next learning milestone

### 🎯 **Final Reflection Check-in**

**Before you move on, take a moment to celebrate:**
- What''s one thing about programming that excited you today?
- Which tool or concept do you want to explore first?
- How do you feel about starting this programming journey?
- What''s one question you''d like to ask a developer right now?

```mermaid
journey
    title Your Confidence Building Journey
    section Today
      Curious: 3: You
      Overwhelmed: 4: You
      Excited: 5: You
    section This Week
      Exploring: 4: You
      Learning: 5: You
      Connecting: 4: You
    section Next Month
      Building: 5: You
      Confident: 5: You
      Helping Others: 5: You
```

> 🌟 **Remember**: Every expert was once a beginner. Every senior developer once felt exactly like you do right now – excited, maybe a little overwhelmed, and definitely curious about what''s possible. You''re in amazing company, and this journey is going to be incredible. Welcome to the wonderful world of programming! 🎉',34);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'web-development-foundations-2','Introduction to GitHub',2,'# Introduction to GitHub

Hey there, future developer! 👋 Ready to join millions of coders around the world? I''m genuinely excited to introduce you to GitHub – think of it as the social media platform for programmers, except instead of sharing photos of your lunch, we''re sharing code and building incredible things together!

Here''s what absolutely blows my mind: every app on your phone, every website you visit, and most of the tools you''ll learn to use were built by teams of developers collaborating on platforms just like GitHub. That music app you love? Someone like you contributed to it. That game you can''t put down? Yep, probably built with GitHub collaboration. And now YOU''RE going to learn how to be part of that amazing community!

I know this might feel like a lot at first – heck, I remember staring at my first GitHub page thinking "What on earth does any of this mean?" But here''s the thing: every single developer started exactly where you are right now. By the end of this lesson, you''ll have your very own GitHub repository (think of it as your personal project showcase in the cloud), and you''ll know how to save your work, share it with others, and even contribute to projects that millions of people use. 

We''re going to take this journey together, one step at a time. No rushing, no pressure – just you, me, and some really cool tools that are about to become your new best friends!


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

```mermaid
journey
    title Your GitHub Adventure Today
    section Setup
      Install Git: 4: You
      Create Account: 5: You
      First Repository: 5: You
    section Master Git
      Local Changes: 4: You
      Commits & Pushes: 5: You
      Branching: 4: You
    section Collaborate
      Fork Projects: 4: You
      Pull Requests: 5: You
      Open Source: 5: You
```

## Pre-Lecture Quiz
Pre-lecture quiz (https://ff-quizzes.netlify.app/)

## Introduction

Before we dive into the really exciting stuff, let''s get your computer ready for some GitHub magic! Think of this like organizing your art supplies before creating a masterpiece – having the right tools ready makes everything so much smoother and way more fun.

I''m going to walk you through each setup step personally, and I promise it''s not nearly as intimidating as it might look at first glance. If something doesn''t click right away, that''s completely normal! I remember setting up my first development environment and feeling like I was trying to read ancient hieroglyphics. Every single developer has been exactly where you are right now, wondering if they''re doing it right. Spoiler alert: if you''re here learning, you''re already doing it right! 🌟

In this lesson, we''ll cover:

- tracking the work you do on your machine
- working on projects with others
- how to contribute to open source software

### Prerequisites

Let''s get your computer ready for some GitHub magic! Don''t worry – this setup is something you only need to do once, and then you''ll be all set for your entire coding journey.

Alright, let''s start with the foundation! First, we need to check if Git is already hanging out on your computer. Git is basically like having a super-smart assistant that remembers every single change you make to your code – way better than frantically hitting Ctrl+S every two seconds (we''ve all been there!).

Let''s see if Git is already installed by typing this magic command in your terminal:
`git --version`

If Git isn''t there yet, no worries! Just head over to download Git (https://git-scm.com/downloads) and grab it. Once you''ve got it installed, we need to introduce Git to you properly:

> 💡 **First Time Setup**: These commands tell Git who you are. This information will be attached to every commit you make, so choose a name and email you''re comfortable sharing publicly.

```bash
git config --global user.name "your-name"
git config --global user.email "your-email"
```

To check if Git is already configured you can type:
```bash
git config --list
```

You''ll also need a GitHub account, a code editor (like Visual Studio Code), and you''ll need to open your terminal (or: command prompt).

Navigate to github.com (https://github.com/) and create an account if you haven''t already, or log in and fill out your profile. 

💡 **Modern tip**: Consider setting up SSH keys (https://docs.github.com/en/authentication/connecting-to-github-with-ssh) or using GitHub CLI (https://cli.github.com/) for easier authentication without passwords. 

✅ GitHub isn''t the only code repository in the world; there are others, but GitHub is the best known

### Preparation

You''ll need both a folder with a code project on your local machine (laptop or PC), and a public repository on GitHub, which will serve as an example for how to contribute to the projects of others.  

### Keeping Your Code Safe

Let''s talk about security for a moment – but don''t worry, we''re not going to overwhelm you with scary stuff! Think of these security practices like locking your car or your house. They''re simple habits that become second nature and keep your hard work protected.

We''ll show you the modern, secure ways to work with GitHub right from the start. This way, you''ll develop good habits that will serve you well throughout your coding career.

When working with GitHub, it''s important to follow security best practices:

| Security Area | Best Practice | Why It Matters |
|---------------|---------------|----------------|
| **Authentication** | Use SSH keys or Personal Access Tokens | Passwords are less secure and being phased out |
| **Two-Factor Authentication** | Enable 2FA on your GitHub account | Adds an extra layer of account protection |
| **Repository Security** | Never commit sensitive information | API keys and passwords should never be in public repos |
| **Dependency Management** | Enable Dependabot for updates | Keeps your dependencies secure and up-to-date |

> ⚠️ **Critical Security Reminder**: Never commit API keys, passwords, or other sensitive information to any repository. Use environment variables and `.gitignore` files to protect sensitive data.

**Modern Authentication Setup:**

```bash
# Generate SSH key (modern ed25519 algorithm)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Set up Git to use SSH
git remote set-url origin git@github.com:username/repository.git
```

> 💡 **Pro Tip**: SSH keys eliminate the need to enter passwords repeatedly and are more secure than traditional authentication methods.

---

## Managing Your Code Like a Pro

Okay, THIS is where things get really exciting! 🎉 We''re about to learn how to track and manage your code like the pros do, and honestly, this is one of my favorite things to teach because it''s such a game-changer.

Picture this: you''re writing an amazing story, and you want to keep track of every draft, every brilliant edit, and every "wait, that''s genius!" moment along the way. That''s exactly what Git does for your code! It''s like having the most incredible time-traveling notebook that remembers EVERYTHING – every keystroke, every change, every "oops, that broke everything" moment that you can instantly undo.

I''ll be honest – this might feel overwhelming at first. When I started, I thought "Why can''t I just save my files like normal?" But trust me on this: once Git clicks for you (and it will!), you''ll have one of those lightbulb moments where you think "How did I EVER code without this?" It''s like discovering you can fly when you''ve been walking everywhere your whole life!

Let''s say you have a folder locally with some code project and you want to start tracking your progress using git - the version control system. Some people compare using git to writing a love letter to your future self. Reading your commit messages days or weeks or months later you''ll be able to recall why you made a decision, or "rollback" a change - that is, when you write good "commit messages".

```mermaid
flowchart TD
    A[📁 Your Project Files] --> B{Is it a Git Repository?}
    B -->|No| C[git init]
    B -->|Yes| D[Make Changes]
    C --> D
    D --> E[git add .]
    E --> F["git commit -m ''message''"]
    F --> G[git push]
    G --> H[🌟 Code on GitHub!]
    
    H --> I{Want to collaborate?}
    I -->|Yes| J[Fork & Clone]
    I -->|No| D
    J --> K[Create Branch]
    K --> L[Make Changes]
    L --> M[Pull Request]
    M --> N[🎉 Contributing!]
    
    style A fill:#fff59d
    style H fill:#c8e6c9
    style N fill:#ff4081,color:#fff
```

### Task: Create Your First Repository!

> 🎯 **Your Mission (and I''m so excited for you!)**: We''re going to create your very first GitHub repository together! By the time we''re done here, you''ll have your own little corner of the internet where your code lives, and you''ll have made your first "commit" (that''s developer speak for saving your work in a really smart way). 
>
> This is honestly such a special moment – you''re about to officially join the global community of developers! I still remember the thrill of creating my first repo and thinking "Wow, I''m really doing this!"

Let''s walk through this adventure together, step by step. Take your time with each part – there''s no prize for rushing, and I promise every single step will make sense. Remember, every coding superstar you admire was once sitting exactly where you are, about to create their first repository. How cool is that?

> Check out video
> 
> [](https://www.youtube.com/watch?v=9R31OUPpxU4)

**Let''s Do This Together:**

1. **Create your repository on GitHub**. Head over to GitHub.com and look for that bright green **New** button (or the **+** sign in the top right corner). Click it and select **New repository**.

   Here''s what to do:
   1. Give your repository a name – make it something meaningful to you!
   1. Add a description if you want (this helps others understand what your project is about)
   1. Decide if you want it public (everyone can see it) or private (just for you)
   1. I recommend checking the box to add a README file – it''s like the front page of your project
   1. Click **Create repository** and celebrate – you just created your first repo! 🎉

2. **Navigate to your project folder**. Now let''s open up your terminal (don''t worry, it''s not as scary as it looks!). We need to tell your computer where your project files are. Type this command:

   ```bash
   cd [name of your folder]
   ```

   **What we''re doing here:**
   - We''re basically saying "Hey computer, take me to my project folder"
   - This is like opening a specific folder on your desktop, but we''re doing it with text commands
   - Replace `[name of your folder]` with the actual name of your project folder

3. **Turn your folder into a Git repository**. This is where the magic happens! Type:

   ```bash
   git init
   ```

   **Here''s what just happened (pretty cool stuff!):**
   - Git just created a hidden `.git` folder in your project – you won''t see it, but it''s there!
   - Your regular folder is now a "repository" that can track every change you make
   - Think of it like giving your folder superpowers to remember everything

4. **Check what''s happening**. Let''s see what Git thinks about your project right now:

   ```bash
   git status
   ```

   **Understanding what Git is telling you:**
   
   You might see something that looks like this:

   ```output
   Changes not staged for commit:
   (use "git add ..." to update what will be committed)
   (use "git restore ..." to discard changes in working directory)

        modified:   file.txt
        modified:   file2.txt
   ```

   **Don''t panic! Here''s what this means:**
   - Files in **red** are files that have changes but aren''t ready to be saved yet
   - Files in **green** (when you see them) are ready to be saved
   - Git is being helpful by telling you exactly what you can do next

   > 💡 **Pro tip**: The `git status` command is your best friend! Use it anytime you''re confused about what''s going on. It''s like asking Git "Hey, what''s the situation right now?"

5. **Get your files ready to save** (this is called "staging"):

   ```bash
   git add .
   ```

   **What we just did:**
   - We told Git "Hey, I want to include ALL my files in the next save"
   - The `.` is like saying "everything in this folder"
   - Now your files are "staged" and ready for the next step

   **Want to be more selective?** You can add just specific files:

   ```bash
   git add [file or folder name]
   ```

   **Why might you want to do this?**
   - Sometimes you want to save related changes together
   - It helps you organize your work into logical chunks
   - Makes it easier to understand what changed and when

   **Changed your mind?** No worries! You can unstage files like this:

   ```bash
   # Unstage everything
   git reset
   
   # Unstage just one file
   git reset [file name]
   ```

   Don''t worry – this doesn''t delete your work, it just takes files out of the "ready to save" pile.

6. **Save your work permanently** (making your first commit!):

   ```bash
   git commit -m "first commit"
   ```

   **🎉 Congratulations! You just made your first commit!**
   
   **Here''s what just happened:**
   - Git took a "snapshot" of all your staged files at this exact moment
   - Your commit message "first commit" explains what this save point is about
   - Git gave this snapshot a unique ID so you can always find it later
   - You''ve officially started tracking your project''s history!

   > 💡 **Future commit messages**: For your next commits, be more descriptive! Instead of "updated stuff", try "Add contact form to homepage" or "Fix navigation menu bug". Your future self will thank you!

7. **Connect your local project to GitHub**. Right now, your project exists only on your computer. Let''s connect it to your GitHub repository so you can share it with the world!

   First, go to your GitHub repository page and copy the URL. Then come back here and type:

   ```bash
   git remote add origin https://github.com/username/repository_name.git
   ```
   
   (Replace that URL with your actual repository URL!)

   **What we just did:**
   - We created a connection between your local project and your GitHub repository
   - "Origin" is just a nickname for your GitHub repository – it''s like adding a contact to your phone
   - Now your local Git knows where to send your code when you''re ready to share it

   💡 **Easier way**: If you have GitHub CLI installed, you can do this in one command:
   ```bash
   gh repo create my-repo --public --push --source=.
   ```

8. **Send your code to GitHub** (the big moment!):

   ```bash
   git push -u origin main
   ```

   **🚀 This is it! You''re uploading your code to GitHub!**
   
   **What''s happening:**
   - Your commits are traveling from your computer to GitHub
   - The `-u` flag sets up a permanent connection so future pushes are easier
   - "main" is the name of your primary branch (like the main folder)
   - After this, you can just type `git push` for future uploads!

   💡 **Quick note**: If your branch is called something else (like "master"), use that name instead. You can check with `git branch --show-current`.

9. **Your new daily coding rhythm** (this is where it gets addictive!):

   From now on, whenever you make changes to your project, you''ve got this simple three-step dance:

   ```bash
   git add .
   git commit -m "describe what you changed"
   git push
   ```

   **This becomes your coding heartbeat:**
   - Make some awesome changes to your code ✨
   - Stage them with `git add` ("Hey Git, pay attention to these changes!")
   - Save them with `git commit` and a descriptive message (future you will thank you!)
   - Share them with the world using `git push` 🚀
   - Rinse and repeat – seriously, this becomes as natural as breathing!

   I love this workflow because it''s like having multiple save points in a video game. Made a change you love? Commit it! Want to try something risky? No problem – you can always go back to your last commit if things go sideways!

   > 💡 **Tip**: You might also want to adopt a `.gitignore` file to prevent files you don''t want to track from showing up on GitHub - like that notes file you store in the same folder but has no place on a public repository. You can find templates for `.gitignore` files at .gitignore templates (https://github.com/github/gitignore) or create one using gitignore.io (https://www.toptal.com/developers/gitignore).

### 🧠 **First Repository Check-in: How Did That Feel?**

**Take a moment to celebrate and reflect:**
- How did it feel to see your code appear on GitHub for the first time?
- Which step felt the most confusing, and which felt surprisingly easy?
- Can you explain the difference between `git add`, `git commit`, and `git push` in your own words?

```mermaid
stateDiagram-v2
    [*] --> LocalFiles: Create project
    LocalFiles --> Staged: git add .
    Staged --> Committed: git commit
    Committed --> GitHub: git push
    GitHub --> [*]: Success! 🎉
    
    note right of Staged
        Files ready to save
    end note
    
    note right of Committed
        Snapshot created
    end note
```

> **Remember**: Even experienced developers sometimes forget the exact commands. Having this workflow become muscle memory takes practice - you''re doing great!

#### Modern Git workflows

Consider adopting these modern practices:

- **Conventional Commits**: Use a standardized commit message format like `feat:`, `fix:`, `docs:`, etc. Learn more at conventionalcommits.org (https://www.conventionalcommits.org/)
- **Atomic commits**: Make each commit represent a single logical change
- **Frequent commits**: Commit often with descriptive messages rather than large, infrequent commits

#### Commit messages

A great Git commit subject line completes the following sentence:
If applied, this commit will 

For the subject use the imperative, present tense: "change" not "changed" nor "changes". 
As in the subject, in the body (optional) also use the imperative, present tense. The body should include the motivation for the change and contrast this with previous behavior. You''re explaining the `why`, not the `how`.

✅ Take a few minutes to surf around GitHub. Can you find a really great commit message? Can you find a really minimal one? What information do you think is the most important and useful to convey in a commit message?

## Working with Others (The Fun Part!)

Hold onto your hat because THIS is where GitHub becomes absolutely magical! 🪄 You''ve mastered managing your own code, but now we''re diving into my absolute favorite part – collaborating with amazing people from all over the world.

Picture this: you wake up tomorrow and see that someone in Tokyo improved your code while you were sleeping. Then someone in Berlin fixes a bug you''ve been stuck on. By afternoon, a developer in São Paulo has added a feature you never even thought of. That''s not science fiction – that''s just Tuesday in the GitHub universe!

What gets me really excited is that the collaboration skills you''re about to learn? These are the EXACT same workflows that teams at Google, Microsoft, and your favorite startups use every single day. You''re not just learning a cool tool – you''re learning the secret language that makes the entire software world work together. 

Seriously, once you experience the rush of having someone merge your first pull request, you''ll understand why developers get so passionate about open source. It''s like being part of the world''s biggest, most creative team project!

> Check out video
>
> [](https://www.youtube.com/watch?v=bFCM-PC3cu8)

The main reason for putting things on GitHub was to make it possible to collaborate with other developers.

```mermaid
flowchart LR
    A[🔍 Find Project] --> B[🍴 Fork Repository]
    B --> C[📥 Clone to Local]
    C --> D[🌿 Create Branch]
    D --> E[✏️ Make Changes]
    E --> F[💾 Commit Changes]
    F --> G[📤 Push Branch]
    G --> H[🔄 Create Pull Request]
    H --> I{Maintainer Review}
    I -->|✅ Approved| J[🎉 Merge!]
    I -->|❓ Changes Requested| K[📝 Make Updates]
    K --> F
    J --> L[🧹 Clean Up Branches]
    
    style A fill:#e3f2fd
    style J fill:#e8f5e8
    style L fill:#fff3e0
```

In your repository, navigate to `Insights > Community` to see how your project compares to recommended community standards.

Want to make your repository look professional and welcoming? Head over to your repository and click on `Insights > Community`. This cool feature shows you how your project compares to what the GitHub community considers "good repository practices."

> 🎯 **Making Your Project Shine**: A well-organized repository with good documentation is like having a clean, welcoming storefront. It tells people you care about your work and makes others want to contribute!

**Here''s what makes a repository awesome:**

| What to Add | Why It''s Important | What It Does for You |
|-------------|-------------------|---------------------|
| **Description** | First impression matters! | People know instantly what your project does |
| **README** | Your project''s front page | Like a friendly tour guide for new visitors |
| **Contributing Guidelines** | Shows you welcome help | People know exactly how they can help you |
| **Code of Conduct** | Creates a friendly space | Everyone feels welcome to participate |
| **License** | Legal clarity | Others know how they can use your code |
| **Security Policy** | Shows you''re responsible | Demonstrates professional practices |

> 💡 **Pro Tip**: GitHub provides templates for all of these files. When creating a new repository, check the boxes to automatically generate these files.

**Modern GitHub Features to Explore:**

🤖 **Automation & CI/CD:**
- **GitHub Actions** for automated testing and deployment
- **Dependabot** for automatic dependency updates

💬 **Community & Project Management:**
- **GitHub Discussions** for community conversations beyond issues
- **GitHub Projects** for kanban-style project management
- **Branch protection rules** to enforce code quality standards


All these resources will benefit onboarding new team members. And those are typically the kind of things new contributors look at before even looking at your code, to find out if your project is the right place for them to be spending their time.

✅ README files, although they take time to prepare, are often neglected by busy maintainers. Can you find an example of a particularly descriptive one? Note: there are some tools to help create good READMEs (https://www.makeareadme.com/) that you might like to try.

### Task: Merge some code

Contributing docs help people contribute to the project. It explains what types of contributions you''re looking for and how the process works. Contributors will need to go through a series of steps to be able to contribute to your repo on GitHub:


1. **Forking your repo** You will probably want people to _fork_ your project. Forking means creating a replica of your repository on their GitHub profile.
1. **Clone**. From there they will clone the project to their local machine. 
1. **Create a branch**. You will want to ask them to create a _branch_ for their work. 
1. **Focus their change on one area**. Ask contributors to concentrate their contributions on one thing at a time - that way the chances that you can _merge_ in their work is higher. Imagine they write a bug fix, add a new feature, and update several tests - what if you want to, or can only implement 2 out of 3, or 1 out of 3 changes?

✅ Imagine a situation where branches are particularly critical to writing and shipping good code. What use cases can you think of?

> Note, be the change you want to see in the world, and create branches for your own work as well. Any commits you make will be made on the branch you’re currently “checked out” to. Use `git status` to see which branch that is.

Let''s go through a contributor workflow. Assume the contributor has already _forked_ and _cloned_ the repo so they have a Git repo ready to be worked on, on their local machine:

1. **Create a branch**. Use the command `git branch` to create a branch that will contain the changes they mean to contribute:

   ```bash
   git branch [branch-name]
   ```

   > 💡 **Modern Approach**: You can also create and switch to the new branch in one command:
   ```bash
   git switch -c [branch-name]
   ```

1. **Switch to working branch**. Switch to the specified branch and update the working directory with `git switch`:

   ```bash
   git switch [branch-name]
   ```

   > 💡 **Modern Note**: `git switch` is the modern replacement for `git checkout` when changing branches. It''s clearer and safer for beginners.

1. **Do work**. At this point you want to add your changes. Don''t forget to tell Git about it with the following commands:

   ```bash
   git add .
   git commit -m "my changes"
   ```

   > ⚠️ **Commit Message Quality**: Ensure you give your commit a good name, both for your sake and the maintainer of the repo you are helping on. Be specific about what you changed!

1. **Combine your work with the `main` branch**. At some point you are done working and you want to combine your work with that of the `main` branch. The `main` branch might have changed meanwhile so make sure you first update it to the latest with the following commands:

   ```bash
   git switch main
   git pull
   ```

   At this point you want to make sure that any _conflicts_, situations where Git can''t easily _combine_ the changes happens in your working branch. Therefore run the following commands:

   ```bash
   git switch [branch_name]
   git merge main
   ```

   The `git merge main` command will bring in all changes from `main` into your branch. Hopefully you can just continue. If not, VS Code will tell you where Git is _confused_ and you just alter the affected files to say which content is the most accurate.

   💡 **Modern alternative**: Consider using `git rebase` for a cleaner history:
   ```bash
   git rebase main
   ```
   This replays your commits on top of the latest main branch, creating a linear history.

1. **Send your work to GitHub**. Sending your work to GitHub means two things. Pushing your branch to your repo and then open up a PR, Pull Request.

   ```bash
   git push --set-upstream origin [branch-name]
   ```

   The above command creates the branch on your forked repo.

### 🤝 **Collaboration Skills Check: Ready to Work with Others?**

**Let''s see how you''re feeling about collaboration:**
- Does the idea of forking and pull requests make sense to you now?
- What''s one thing about working with branches that you want to practice more?
- How comfortable do you feel about contributing to someone else''s project?

```mermaid
mindmap
  root((Git Collaboration))
    Branching
      Feature branches
      Bug fix branches
      Experimental work
    Pull Requests
      Code review
      Discussion
      Testing
    Best Practices
      Clear commit messages
      Small focused changes
      Good documentation
```

> **Confidence booster**: Every single developer you admire was once nervous about their first pull request. The GitHub community is incredibly welcoming to newcomers!

1. **Open a PR**. Next, you want to open up a PR. You do that by navigating to the forked repo on GitHub. You will see an indication on GitHub where it asks whether you want to create a new PR, you click that and you are taken to an interface where you can change commit message title, give it a more suitable description. Now the maintainer of the repo you forked will see this PR and _fingers crossed_ they will appreciate and _merge_ your PR. You are now a contributor, yay :)

   💡 **Modern tip**: You can also create PRs using GitHub CLI:
   ```bash
   gh pr create --title "Your PR title" --body "Description of changes"
   ```

   🔧 **Best practices for PRs**:
   - Link to related issues using keywords like "Fixes #123"
   - Add screenshots for UI changes
   - Request specific reviewers
   - Use draft PRs for work-in-progress
   - Ensure all CI checks pass before requesting review

1. **Clean up**. It''s considered good practice to _clean up_ after you successfully merge a PR. You want to clean up both your local branch and the branch you pushed to GitHub. First let''s delete it locally with the following command: 

   ```bash
   git branch -d [branch-name]
   ```

   Ensure you go the GitHub page for the forked repo next and remove the remote branch you just pushed to it.

`Pull request` seems like a silly term because really you want to push your changes to the project. But the maintainer (project owner) or core team needs to consider your changes before merging it with the project''s "main" branch, so you''re really requesting a change decision from a maintainer.  

A pull request is the place to compare and discuss the differences introduced on a branch with reviews, comments, integrated tests, and more. A good pull request follows roughly the same rules as a commit message. You can add a reference to an issue in the issue tracker, when your work for instance fixes an issue. This is done using a `#` followed by the number of your issue. For example `#97`.

🤞Fingers crossed that all checks pass and the project owner(s) merge your changes into the project🤞

Update your current local working branch with all new commits from the corresponding remote branch on GitHub:

`git pull`

## Contributing to Open Source (Your Chance to Make an Impact!)

Are you ready for something that''s going to absolutely blow your mind? 🤯 Let''s talk about contributing to open source projects – and I''m getting goosebumps just thinking about sharing this with you!

This is your chance to become part of something truly extraordinary. Imagine improving the tools that millions of developers use every day, or fixing a bug in an app that your friends love. That''s not just a dream – that''s what open source contribution is all about!

Here''s what gives me chills every time I think about it: every single tool you''ve been learning with – your code editor, the frameworks we''ll explore, even the browser you''re reading this in – started with someone exactly like you making their very first contribution. That brilliant developer who built your favorite VS Code extension? They were once a beginner clicking "create pull request" with shaky hands, just like you''re about to do.

And here''s the most beautiful part: the open source community is like the internet''s biggest group hug. Most projects actively look for newcomers and have issues tagged "good first issue" specifically for people like you! Maintainers genuinely get excited when they see new contributors because they remember their own first steps.

```mermaid
flowchart TD
    A[🔍 Explore GitHub] --> B[🏷️ Find "good first issue"]
    B --> C[📖 Read Contributing Guidelines]
    C --> D[🍴 Fork Repository]
    D --> E[💻 Set Up Local Environment]
    E --> F[🌿 Create Feature Branch]
    F --> G[✨ Make Your Contribution]
    G --> H[🧪 Test Your Changes]
    H --> I[📝 Write Clear Commit]
    I --> J[📤 Push & Create PR]
    J --> K[💬 Engage with Feedback]
    K --> L[🎉 Merged! You''re a Contributor!]
    L --> M[🌟 Find Next Issue]
    
    style A fill:#e1f5fe
    style L fill:#c8e6c9
    style M fill:#fff59d
```

You''re not just learning to code here – you''re preparing to join a global family of builders who wake up every day thinking "How can we make the digital world a little bit better?" Welcome to the club! 🌟

First, let''s find a repository (or **repo**) on GitHub of interest to you and to which you''d like to contribute a change. You will want to copy its contents to your machine.

✅ A good way to find ''beginner-friendly'' repos is to search by the tag ''good-first-issue'' (https://github.blog/2020-01-22-browse-good-first-issues-to-start-contributing-to-open-source/).



There are several ways of copying code. One way is to "clone" the contents of the repository, using HTTPS, SSH, or using the GitHub CLI (Command Line Interface). 

Open your terminal and clone the repository like so:
```bash
# Using HTTPS
git clone https://github.com/ProjectURL

# Using SSH (requires SSH key setup)
git clone git@github.com:username/repository.git

# Using GitHub CLI
gh repo clone username/repository
```

To work on the project, switch to the right folder:
`cd ProjectURL`

You can also open the entire project using:
- **GitHub Codespaces (https://github.com/features/codespaces)** - GitHub''s cloud development environment with VS Code in the browser
- **GitHub Desktop (https://desktop.github.com/)** - A GUI application for Git operations  
- **GitHub.dev (https://github.dev/)** - Press the `.` key on any GitHub repo to open VS Code in the browser
- **VS Code** with the GitHub Pull Requests extension

Lastly, you can download the code in a zipped folder. 

### A few more interesting things about GitHub

You can star, watch and/or "fork" any public repository on GitHub. You can find your starred repositories in the top-right drop-down menu. It''s like bookmarking, but for code. 

Projects have an issue tracker, mostly on GitHub in the "Issues" tab unless indicated otherwise, where people discuss issues related to the project. And the Pull Requests tab is where people discuss and review changes that are in progress.

Projects might also have discussion in forums, mailing lists, or chat channels like Slack, Discord or IRC.

🔧 **Modern GitHub features**:
- **GitHub Discussions** - Built-in forum for community conversations
- **GitHub Sponsors** - Support maintainers financially  
- **Security tab** - Vulnerability reports and security advisories
- **Actions tab** - See automated workflows and CI/CD pipelines
- **Insights tab** - Analytics about contributors, commits, and project health
- **Projects tab** - GitHub''s built-in project management tools

✅ Take a look around your new GitHub repo and try a few things, like editing settings, adding information to your repo, creating a project (like a Kanban board), and setting up GitHub Actions for automation. There''s a lot you can do!

---

## 🚀 Challenge 

Alright, it''s time to put your shiny new GitHub superpowers to the test! 🚀 Here''s a challenge that''s going to make everything click in the most satisfying way:

Grab a friend (or that family member who''s always asking what you''re up to with all this "computer stuff") and embark on a collaborative coding adventure together! This is where the real magic happens – create a project, let them fork it, make some branches, and merge changes like the pros you''re becoming.

I''m not gonna lie – you''ll probably laugh at some point (especially when you both try to change the same line), maybe scratch your heads in confusion, but you''ll definitely have those amazing "aha!" moments that make all the learning worth it. Plus, there''s something special about sharing that first successful merge with someone else – it''s like a tiny celebration of how far you''ve come!

Don''t have a coding buddy yet? No worries at all! The GitHub community is packed with incredibly welcoming people who remember what it was like to be new. Look for repositories with "good first issue" labels – they''re basically saying "Hey beginners, come learn with us!" How awesome is that?

## Post-Lecture Quiz
Post-lecture quiz (https://ff-quizzes.netlify.app/web/en/)

## Review & Keep Learning

Whew! 🎉 Look at you – you''ve just conquered GitHub basics like an absolute champion! If your brain feels a little full right now, that''s completely normal and honestly a good sign. You''ve just learned tools that took me weeks to feel comfortable with when I started.

Git and GitHub are incredibly powerful (like, seriously powerful), and every developer I know – including the ones who seem like wizards now – had to practice and stumble around a bit before it all clicked. The fact that you''ve made it through this lesson means you''re already on your way to mastering some of the most important tools in a developer''s toolkit.

Here are some absolutely fantastic resources to help you practice and become even more awesome:

- Contributing to open source software guide (https://opensource.guide/how-to-contribute/#how-to-submit-a-contribution) – Your roadmap to making a difference
- Git cheatsheet (https://training.github.com/downloads/github-git-cheat-sheet/) – Keep this handy for quick reference!

And remember: practice makes progress, not perfection! The more you use Git and GitHub, the more natural it becomes. GitHub has created some amazing interactive courses that let you practice in a safe environment:

- Introduction to GitHub (https://github.com/skills/introduction-to-github)
- Communicate using Markdown (https://github.com/skills/communicate-using-markdown)  
- GitHub Pages (https://github.com/skills/github-pages)
- Managing merge conflicts (https://github.com/skills/resolve-merge-conflicts)

**Feeling adventurous? Check out these modern tools:**
- GitHub CLI documentation (https://cli.github.com/manual/) – For when you want to feel like a command-line wizard
- GitHub Codespaces documentation (https://docs.github.com/en/codespaces) – Code in the cloud!
- GitHub Actions documentation (https://docs.github.com/en/actions) – Automate all the things
- Git best practices (https://www.atlassian.com/git/tutorials/comparing-workflows) – Level up your workflow game 

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Create a collaborative web development project that demonstrates the complete GitHub workflow you''ve learned in this lesson. This challenge will help you practice repository creation, collaboration features, and modern Git workflows in a real-world scenario.

**Prompt:** Create a new public GitHub repository for a simple "Web Development Resources" project. The repository should include a well-structured README.md file listing useful web development tools and resources, organized by categories (HTML, CSS, JavaScript, etc.). Set up the repository with proper community standards including a license, contributing guidelines, and a code of conduct. Create at least two feature branches: one for adding CSS resources and another for JavaScript resources. Make commits to each branch with descriptive commit messages, then create pull requests to merge the changes back to main. Enable GitHub features like Issues, Discussions, and set up a basic GitHub Actions workflow for automated checks.

## Assignment 

Your mission, should you choose to accept it: Complete the Introduction to GitHub (https://github.com/skills/introduction-to-github) course on GitHub Skills. This interactive course will let you practice everything you''ve learned in a safe, guided environment. Plus, you''ll get a cool badge when you finish! 🏅

**Feeling ready for more challenges?**
- Set up SSH authentication for your GitHub account (no more passwords!)
- Try using GitHub CLI for your daily Git operations
- Create a repository with a GitHub Actions workflow
- Explore GitHub Codespaces by opening this very repository in a cloud-based editor

---

## 🚀 Your GitHub Mastery Timeline

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Star this repository and 3 other projects that interest you
- [ ] Set up two-factor authentication on your GitHub account
- [ ] Create a simple README for your first repository
- [ ] Follow 5 developers whose work inspires you

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and reflect on your GitHub journey
- [ ] Set up SSH keys for password-free GitHub authentication
- [ ] Create your first meaningful commit with a great commit message
- [ ] Explore GitHub''s "Explore" tab to discover trending projects
- [ ] Practice forking a repository and making a small change

### 📅 **Your Week-Long GitHub Adventure**
- [ ] Complete the GitHub Skills courses (Introduction to GitHub, Markdown)
- [ ] Make your first pull request to an open source project
- [ ] Set up a GitHub Pages site to showcase your work
- [ ] Join GitHub Discussions on projects you''re interested in
- [ ] Create a repository with proper community standards (README, License, etc.)
- [ ] Try GitHub Codespaces for cloud-based development

### 🌟 **Your Month-Long Transformation**
- [ ] Contribute to 3 different open source projects
- [ ] Mentor someone new to GitHub (pay it forward!)
- [ ] Set up automated workflows with GitHub Actions
- [ ] Build a portfolio showcasing your GitHub contributions
- [ ] Participate in Hacktoberfest or similar community events
- [ ] Become a maintainer of your own project that others contribute to

### 🎓 **Final GitHub Mastery Check-in**

**Celebrate how far you''ve come:**
- What''s your favorite thing about using GitHub?
- Which collaboration feature excites you most?
- How confident do you feel about contributing to open source now?
- What''s the first project you want to contribute to?

```mermaid
journey
    title Your GitHub Confidence Journey
    section Today
      Nervous: 3: You
      Curious: 4: You
      Excited: 5: You
    section This Week
      Practicing: 4: You
      Contributing: 5: You
      Connecting: 5: You
    section Next Month
      Collaborating: 5: You
      Leading: 5: You
      Inspiring Others: 5: You
```

> 🌍 **Welcome to the global developer community!** You now have the tools to collaborate with millions of developers worldwide. Your first contribution might seem small, but remember - every major open source project started with someone making their very first commit. The question isn''t if you''ll make an impact, but what amazing project will benefit from your unique perspective first! 🚀

Remember: every expert was once a beginner. You''ve got this! 💪',34);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'web-development-foundations-3','Creating Accessible Webpages',3,'# Creating Accessible Webpages


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

```mermaid
journey
    title Your Accessibility Learning Adventure
    section Foundation
      Understanding Users: 5: You
      Testing Tools: 4: You
      POUR Principles: 5: You
    section Build Skills
      Semantic HTML: 4: You
      Visual Design: 5: You
      ARIA Techniques: 4: You
    section Master Practice
      Keyboard Navigation: 5: You
      Form Accessibility: 4: You
      Real-world Testing: 5: You
```

## Pre-Lecture Quiz
Pre-lecture quiz (https://ff-quizzes.netlify.app/web/)

> The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect.
>
> \- Sir Timothy Berners-Lee, W3C Director and inventor of the World Wide Web

Here''s something that might surprise you: when you build accessible websites, you''re not just helping people with disabilities—you''re actually making the web better for everyone!

Ever notice those curb cuts at street corners? They were originally designed for wheelchairs, but now they help people with strollers, delivery workers with dollies, travelers with rolling luggage, and cyclists too. That''s exactly how accessible web design works—solutions that help one group often end up benefiting everyone. Pretty cool, right?

In this lesson, we''re going to explore how to create websites that truly work for everyone, no matter how they browse the web. You''ll discover practical techniques that are already built into web standards, get hands-on with testing tools, and see how accessibility makes your sites more usable for all users.

By the end of this lesson, you''ll have the confidence to make accessibility a natural part of your development workflow. Ready to explore how thoughtful design choices can open up the web to billions of users? Let''s dive in!

```mermaid
mindmap
  root((Web Accessibility))
    Users
      Screen readers
      Keyboard navigation
      Voice control
      Magnification
    Technologies
      HTML semantics
      ARIA attributes
      CSS focus indicators
      Keyboard events
    Benefits
      Wider audience
      Better SEO
      Legal compliance
      Universal design
    Testing
      Automated tools
      Manual testing
      User feedback
      Real assistive tech
```

> You can take this lesson on Microsoft Learn (https://docs.microsoft.com/learn/modules/web-development-101/accessibility/?WT.mc_id=academic-77807-sagibbon)!

## Understanding Assistive Technologies

Before we jump into coding, let''s take a moment to understand how people with different abilities actually experience the web. This isn''t just theory—understanding these real-world navigation patterns will make you a much better developer!

Assistive technologies are pretty amazing tools that help people with disabilities interact with websites in ways that might surprise you. Once you get the hang of how these technologies work, creating accessible web experiences becomes way more intuitive. It''s like learning to see your code through someone else''s eyes.

### Screen readers

Screen readers (https://en.wikipedia.org/wiki/Screen_reader) are pretty sophisticated pieces of technology that convert digital text into speech or braille output. While they''re primarily used by people with visual impairments, they''re also super helpful for users with learning disabilities like dyslexia.

I like to think of a screen reader as having a really smart narrator reading a book to you. It reads content aloud in a logical order, announces interactive elements like "button" or "link," and provides keyboard shortcuts for jumping around a page. But here''s the thing—screen readers can only work their magic if we build websites with proper structure and meaningful content. That''s where you come in as a developer!

**Popular screen readers across platforms:**
- **Windows**: NVDA (https://www.nvaccess.org/about-nvda/) (free and most popular), JAWS (https://webaim.org/articles/jaws/), Narrator (https://support.microsoft.com/windows/complete-guide-to-narrator-e4397a0d-ef4f-b386-d8ae-c172f109bdb1/?WT.mc_id=academic-77807-sagibbon) (built-in)
- **macOS/iOS**: VoiceOver (https://support.apple.com/guide/voiceover/welcome/10) (built-in and very capable)
- **Android**: TalkBack (https://support.google.com/accessibility/android/answer/6283677) (built-in)
- **Linux**: Orca (https://wiki.gnome.org/Projects/Orca) (free and open-source)

**How screen readers navigate web content:**

Screen readers provide multiple navigation methods that make browsing efficient for experienced users:
- **Sequential reading**: Reads content from top to bottom, like following a book
- **Landmark navigation**: Jump between page sections (header, nav, main, footer)
- **Heading navigation**: Skip between headings to understand page structure
- **Link lists**: Generate a list of all links for quick access
- **Form controls**: Navigate directly between input fields and buttons

> 💡 **Here''s something that blew my mind**: 68% of screen reader users navigate primarily by headings (WebAIM Survey (https://webaim.org/projects/screenreadersurvey9/#finding)). This means your heading structure is like a roadmap for users—when you get it right, you''re literally helping people find their way around your content faster!

### Building your testing workflow

Here''s some good news—effective accessibility testing doesn''t have to be overwhelming! You''ll want to combine automated tools (they''re fantastic at catching obvious issues) with some hands-on testing. Here''s a systematic approach that I''ve found catches the most issues without eating up your entire day:

**Essential manual testing workflow:**

```mermaid
flowchart TD
    A[🚀 Start Testing] --> B{⌨️ Keyboard Navigation}
    B --> C[Tab through all interactive elements]
    C --> D{🎧 Screen Reader Testing}
    D --> E[Test with NVDA/VoiceOver]
    E --> F{🔍 Zoom Testing}
    F --> G[Zoom to 200% and test functionality]
    G --> H{🎨 Color/Contrast Check}
    H --> I[Verify all text meets contrast ratios]
    I --> J{👁️ Focus Management}
    J --> K[Ensure focus indicators are visible]
    K --> L[✅ Testing Complete]
    
    style A fill:#e3f2fd
    style L fill:#e8f5e8
    style B fill:#fff3e0
    style D fill:#f3e5f5
    style F fill:#e0f2f1
    style H fill:#fce4ec
    style J fill:#e8eaf6
```

**Step-by-step testing checklist:**
1. **Keyboard navigation**: Use only Tab, Shift+Tab, Enter, Space, and Arrow keys
2. **Screen reader testing**: Enable NVDA, VoiceOver, or Narrator and navigate with eyes closed
3. **Zoom testing**: Test at 200% and 400% zoom levels
4. **Color contrast verification**: Check all text and UI components
5. **Focus indicator testing**: Ensure all interactive elements have visible focus states

✅ **Start with Lighthouse**: Open your browser''s DevTools, run a Lighthouse accessibility audit, then use the results to guide your manual testing focus areas.

### Zoom and magnification tools

You know how you sometimes pinch to zoom on your phone when text is too small, or squint at your laptop screen in bright sunlight? Many users rely on magnification tools to make content readable every single day. This includes people with low vision, older adults, and anyone who''s ever tried to read a website outdoors.

Modern zoom technologies have evolved beyond just making things bigger. Understanding how these tools work will help you create responsive designs that remain functional and attractive at any magnification level.

**Modern browser zoom capabilities:**
- **Page zoom**: Scales all content proportionally (text, images, layout) - this is the preferred method
- **Text-only zoom**: Increases font size while maintaining original layout
- **Pinch-to-zoom**: Mobile gesture support for temporary magnification
- **Browser support**: All modern browsers support zoom up to 500% without breaking functionality

**Specialized magnification software:**
- **Windows**: Magnifier (https://support.microsoft.com/windows/use-magnifier-to-make-things-on-the-screen-easier-to-see-414948ba-8b1c-d3bd-8615-0e5e32204198) (built-in), ZoomText (https://www.freedomscientific.com/training/zoomtext/getting-started/)
- **macOS/iOS**: Zoom (https://www.apple.com/accessibility/mac/vision/) (built-in with advanced features)

> ⚠️ **Design Consideration**: WCAG requires that content remain functional when zoomed to 200%. At this level, horizontal scrolling should be minimal, and all interactive elements should remain accessible.

✅ **Test your responsive design**: Zoom your browser to 200% and 400%. Does your layout adapt gracefully? Can you still access all functionality without excessive scrolling?

## Modern Accessibility Testing Tools

Now that you understand how people navigate the web with assistive technologies, let''s explore the tools that help you build and test accessible websites.

Think of it like this: automated tools are great at catching obvious issues (like missing alt text), while hands-on testing helps you ensure your site feels good to use in the real world. Together, they give you confidence that your sites work for everyone.

### Color contrast testing

Here''s some good news: color contrast is one of the most common accessibility issues, but it''s also one of the easiest to fix. Good contrast benefits everyone—from users with visual impairments to people trying to read their phones at the beach.

**WCAG contrast requirements:**

| Text Type | WCAG AA (Minimum) | WCAG AAA (Enhanced) |
|-----------|-------------------|---------------------|
| **Normal text** (under 18pt) | 4.5:1 contrast ratio | 7:1 contrast ratio |
| **Large text** (18pt+ or 14pt+ bold) | 3:1 contrast ratio | 4.5:1 contrast ratio |
| **UI components** (buttons, form borders) | 3:1 contrast ratio | 3:1 contrast ratio |

**Essential testing tools:**
- Colour Contrast Analyser (https://www.tpgi.com/color-contrast-checker/) - Desktop app with color picker
- WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/) - Web-based with instant feedback
- Stark (https://www.getstark.co/) - Design tool plugin for Figma, Sketch, Adobe XD
- Accessible Colors (https://accessible-colors.com/) - Find accessible color palettes

✅ **Build better color palettes**: Start with your brand colors and use contrast checkers to create accessible variations. Document these as your design system''s accessible color tokens.

### Comprehensive accessibility auditing

The most effective accessibility testing combines multiple approaches. No single tool catches everything, so building a testing routine with various methods ensures thorough coverage.

**Browser-based testing (built into DevTools):**
- **Chrome/Edge**: Lighthouse accessibility audit + Accessibility panel
- **Firefox**: Accessibility Inspector with detailed tree view
- **Safari**: Audit tab in Web Inspector with VoiceOver simulation

**Professional testing extensions:**
- axe DevTools (https://www.deque.com/axe/devtools/) - Industry-standard automated testing
- WAVE (https://wave.webaim.org/extension/) - Visual feedback with error highlighting
- Accessibility Insights (https://accessibilityinsights.io/) - Microsoft''s comprehensive testing suite

**Command-line and CI/CD integration:**
- axe-core (https://github.com/dequelabs/axe-core) - JavaScript library for automated testing
- Pa11y (https://pa11y.org/) - Command-line accessibility testing tool
- Lighthouse CI (https://github.com/GoogleChrome/lighthouse-ci) - Automated accessibility scoring

> 🎯 **Testing Goal**: Aim for a Lighthouse accessibility score of 95+ as your baseline. Remember, automated tools only catch about 30-40% of accessibility issues—manual testing is still essential!

### 🧠 **Testing Skills Check: Ready to Find Issues?**

**Let''s see how you''re feeling about accessibility testing:**
- Which testing method seems most approachable to you right now?
- Can you imagine using keyboard-only navigation for a full day?
- What''s one accessibility barrier you''ve personally experienced online?

```mermaid
pie title "Accessibility Issues Caught by Different Methods"
    "Automated Tools" : 35
    "Manual Testing" : 40
    "User Feedback" : 25
```

> **Confidence booster**: Professional accessibility testers use this exact combination of methods. You''re learning industry-standard practices!

## Building Accessibility from the Ground Up

The key to accessibility success is building it into your foundation from day one. I know it''s tempting to think "I''ll add accessibility later," but that''s like trying to add a ramp to a house after it''s already built. Possible? Yes. Easy? Not really.

Think of accessibility like planning a house—it''s much easier to include wheelchair accessibility in your initial architectural plans than to retrofit everything later.

### The POUR principles: Your accessibility foundation

The Web Content Accessibility Guidelines (WCAG) are built around four fundamental principles that spell out POUR. Don''t worry—these aren''t stuffy academic concepts! They''re actually practical guidelines for making content that works for everyone.

Once you get the hang of POUR, making accessibility decisions becomes way more intuitive. It''s like having a mental checklist that guides your design choices. Let''s break it down:

```mermaid
flowchart LR
    A[🔍 PERCEIVABLECan users sense it?] --> B[🎮 OPERABLECan users use it?]
    B --> C[📖 UNDERSTANDABLECan users get it?]
    C --> D[💪 ROBUSTDoes it work everywhere?]
    
    A1[Alt textCaptionsContrast] --> A
    B1[Keyboard accessNo seizuresTime limits] --> B
    C1[Clear languagePredictableError help] --> C
    D1[Valid codeCompatibleFuture-proof] --> D
    
    style A fill:#e1f5fe
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
```

**🔍 Perceivable**: Information must be presentable in ways users can perceive through their available senses

- Provide text alternatives for non-text content (images, videos, audio)
- Ensure sufficient color contrast for all text and UI components
- Offer captions and transcripts for multimedia content
- Design content that remains functional when resized up to 200%
- Use multiple sensory characteristics (not just color) to convey information

**🎮 Operable**: All interface components must be operable through available input methods

- Make all functionality accessible via keyboard navigation
- Provide users sufficient time to read and interact with content
- Avoid content that causes seizures or vestibular disorders
- Help users navigate efficiently with clear structure and landmarks
- Ensure interactive elements have adequate target sizes (44px minimum)

**📖 Understandable**: Information and UI operation must be clear and comprehensible

- Use clear, simple language appropriate for your audience
- Ensure content appears and operates in predictable, consistent ways
- Provide clear instructions and error messages for user input
- Help users understand and correct mistakes in forms
- Organize content with logical reading order and information hierarchy

**💪 Robust**: Content must work reliably across different technologies and assistive devices

- **Use valid, semantic HTML as your foundation**
- **Ensure compatibility with current and future assistive technologies**
- **Follow web standards and best practices for markup**
- **Test across different browsers, devices, and assistive tools**
- **Structure content so it degrades gracefully when advanced features aren''t supported**

### 🎯 **POUR Principles Check: Making It Stick**

**Quick reflection on the foundations:**
- Can you think of a website feature that fails each POUR principle?
- Which principle feels most natural to you as a developer?
- How might these principles improve design for everyone, not just disabled users?

```mermaid
quadrantChart
    title POUR Principles Impact Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Quick Wins
    quadrant-2 Major Projects
    quadrant-3 Consider Later
    quadrant-4 Strategic Focus
    
    Alt Text: [0.2, 0.9]
    Color Contrast: [0.3, 0.8]
    Semantic HTML: [0.4, 0.9]
    Keyboard Nav: [0.6, 0.8]
    ARIA Complex: [0.8, 0.7]
    Screen Reader Testing: [0.7, 0.6]
```

> **Remember**: Start with high-impact, low-effort improvements. Semantic HTML and alt text give you the biggest accessibility boost for the least effort!

## Creating Accessible Visual Design

Good visual design and accessibility go hand in hand. When you design with accessibility in mind, you often discover that these constraints lead to cleaner, more elegant solutions that benefit all users.

Let''s explore how to create visually appealing designs that work for everyone, regardless of their visual abilities or the conditions under which they''re viewing your content.

### Color and visual accessibility strategies

Color is powerful for communication, but it should never be the only way you convey important information. Designing beyond color creates more robust, inclusive experiences that work in more situations.

**Design for color vision differences:**

Approximately 8% of men and 0.5% of women have some form of color vision difference (often called "color blindness"). The most common types are:
- **Deuteranopia**: Difficulty distinguishing red and green
- **Protanopia**: Red appears more dim
- **Tritanopia**: Difficulty with blue and yellow (rare)

**Inclusive color strategies:**

```css
/* ❌ Bad: Using only color to indicate status */
.error { color: red; }
.success { color: green; }

/* ✅ Good: Color plus icons and context */
.error {
  color: #d32f2f;
  border-left: 4px solid #d32f2f;
}
.error::before {
  content: "⚠️";
  margin-right: 8px;
}

.success {
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}
.success::before {
  content: "✅";
  margin-right: 8px;
}
```

**Beyond basic contrast requirements:**
- Test your color choices with color blind simulators
- Use patterns, textures, or shapes alongside color coding
- Ensure interactive states remain distinguishable without color
- Consider how your design looks in high contrast mode

✅ **Test your color accessibility**: Use tools like Coblis (https://www.color-blindness.com/coblis-color-blindness-simulator/) to see how your site appears to users with different types of color vision.

### Focus indicators and interaction design

Focus indicators are the digital equivalent of a cursor—they show keyboard users where they are on the page. Well-designed focus indicators enhance the experience for everyone by making interactions clear and predictable.

**Modern focus indicator best practices:**

```css
/* Enhanced focus styles that work across browsers */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.25);
}

/* Remove focus outline for mouse users, preserve for keyboard users */
button:focus:not(:focus-visible) {
  outline: none;
}

/* Focus-within for complex components */
.card:focus-within {
  box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.5);
  border-color: #4A90A4;
}

/* Ensure focus indicators meet contrast requirements */
.custom-focus:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
  box-shadow: 0 0 0 6px #000000;
}
```

**Focus indicator requirements:**
- **Visibility**: Must have at least 3:1 contrast ratio with surrounding elements
- **Width**: Minimum 2px thickness around the entire element
- **Persistence**: Should remain visible until focus moves elsewhere
- **Distinction**: Must be visually different from other UI states

> 💡 **Design Tip**: Great focus indicators often use a combination of outline, box-shadow, and color changes to ensure visibility across different backgrounds and contexts.

✅ **Audit focus indicators**: Tab through your website and note which elements have clear focus indicators. Are any difficult to see or missing entirely?

### Semantic HTML: The foundation of accessibility

Semantic HTML is like giving assistive technologies a GPS system for your website. When you use the right HTML elements for their intended purpose, you''re basically providing screen readers, keyboards, and other tools with a detailed roadmap to help users navigate effectively.

Here''s an analogy that really clicked for me: semantic HTML is the difference between a well-organized library with clear categories and helpful signs versus a warehouse where books are scattered randomly. Both places have the same books, but which one would you rather try to find something in? Exactly!

```mermaid
flowchart TD
    A[🏠 HTML Document] --> B[📰 header]
    A --> C[🧭 nav]
    A --> D[📄 main]
    A --> E[📋 footer]
    
    B --> B1[h1: Site NameLogo & branding]
    C --> C1[ul: NavigationPrimary links]
    D --> D1[article: Contentsection: Subsections]
    D --> D2[aside: SidebarRelated content]
    E --> E1[nav: Footer linksCopyright info]
    
    D1 --> D1a[h1: Page titleh2: Major sectionsh3: Subsections]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
```

**Building blocks of accessible page structure:**

```html


  Your Site Name
  
    
      Home
      About
      Services
    
  



  
    
      Article Title
      Published on October 14, 2024
    
    
    
      First Section
      Content that relates to this section...
    
    
    
      Second Section
      More related content...
    
  
  
  
    Related Links
    
      
        First related article
        Second related article
      
    
  



  &copy; 2024 Your Site Name. All rights reserved.
  
    
      Privacy Policy
      Contact Us
    
  

```

**Why semantic HTML transforms accessibility:**

| Semantic Element | Purpose | Screen Reader Benefit |
|------------------|---------|----------------------|
| `` | Page or section header | "Banner landmark" - quick navigation to top |
| `` | Navigation links | "Navigation landmark" - list of nav sections |
| `` | Primary page content | "Main landmark" - skip directly to content |
| `` | Self-contained content | Announces article boundaries |
| `` | Themed content groups | Provides content structure |
| `` | Related sidebar content | "Complementary landmark" |
| `` | Page or section footer | "Contentinfo landmark" |

**Screen reader superpowers with semantic HTML:**
- **Landmark navigation**: Jump between major page sections instantly
- **Heading outlines**: Generate a table of contents from your heading structure
- **Element lists**: Create lists of all links, buttons, or form controls
- **Context awareness**: Understand relationships between content sections

> 🎯 **Quick Test**: Try navigating your site with a screen reader using landmark shortcuts (D for landmark, H for heading, K for link in NVDA/JAWS). Does the navigation make sense?

### 🏗️ **Semantic HTML Mastery Check: Building Strong Foundations**

**Let''s evaluate your semantic understanding:**
- Can you identify the landmarks on a webpage just by looking at the HTML?
- How would you explain the difference between `` and `` to a friend?
- What''s the first thing you''d check if a screen reader user reported navigation problems?

```mermaid
stateDiagram-v2
    [*] --> UnsementicHTML: div soup
    UnsementicHTML --> SemanticHTML: Add landmarks
    SemanticHTML --> AccessibleHTML: Test with AT
    AccessibleHTML --> [*]: User success!
    
    note right of UnsementicHTML
        Screen readers lost
        Keyboard nav broken
    end note
    
    note right of AccessibleHTML
        Clear navigation
        Efficient browsing
    end note
```

> **Pro insight**: Good semantic HTML solves about 70% of accessibility issues automatically. Master this foundation and you''re well on your way!

✅ **Audit your semantic structure**: Use the Accessibility panel in your browser''s DevTools to view the accessibility tree and ensure your markup creates a logical structure.

### Heading hierarchy: Creating a logical content outline

Headings are absolutely crucial for accessible content—they''re like the spine that holds everything together. Screen reader users rely heavily on headings to understand and navigate your content. Think of it as providing a table of contents for your page.

**Here''s the golden rule for headings:**
Never skip levels. Always progress logically from `` to `` to ``, and so on. Remember making outlines in school? It''s exactly the same principle—you wouldn''t jump from "I. Main Point" straight to "C. Sub-sub-point" without a "A. Sub-point" in between, right?

**Perfect heading structure example:**

```html


  Complete Guide to Web Accessibility
  
  
    Understanding Screen Readers
    Introduction to screen reader technology...
    
    Popular Screen Reader Software
    NVDA, JAWS, and VoiceOver comparison...
    
    Testing with Screen Readers
    Step-by-step testing instructions...
  
  
  
    Color and Contrast Guidelines
    Designing with sufficient contrast...
    
    WCAG Contrast Requirements
    Understanding the different contrast levels...
    
    Testing Tools and Techniques
    Tools for verifying contrast ratios...
  

```

```html

Page Title
Subsection 
This should come before h3
Another main heading? 
```

**Heading best practices:**
- **One `` per page**: Typically your main page title or primary content heading
- **Logical progression**: Never skip levels (h1 → h2 → h3, not h1 → h3)
- **Descriptive content**: Make headings meaningful when read out of context
- **Visual styling with CSS**: Use CSS for appearance, HTML levels for structure

**Screen reader navigation statistics:**
- 68% of screen reader users navigate by headings (WebAIM Survey (https://webaim.org/projects/screenreadersurvey9/#finding))
- Users expect to find a logical heading outline
- Headings provide the fastest way to understand page structure

> 💡 **Pro Tip**: Use browser extensions like "HeadingsMap" to visualize your heading structure. It should read like a well-organized table of contents.

✅ **Test your heading structure**: Use a screen reader''s heading navigation (H key in NVDA) to jump through your headings. Does the progression tell the story of your content logically?

### Advanced visual accessibility techniques

Beyond the basics of contrast and color, there are sophisticated techniques that help create truly inclusive visual experiences. These methods ensure your content works across different viewing conditions and assistive technologies.

**Essential visual communication strategies:**

- **Multi-modal feedback**: Combine visual, textual, and sometimes audio cues
- **Progressive disclosure**: Present information in digestible chunks
- **Consistent interaction patterns**: Use familiar UI conventions
- **Responsive typography**: Scale text appropriately across devices
- **Loading and error states**: Provide clear feedback for all user actions

**CSS utilities for enhanced accessibility:**

```css
/* Screen reader only text - visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000000;
  color: #ffffff;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: top 0.3s ease;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* Reduced motion respect */
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
  
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .button {
    border: 2px solid;
  }
}
```

> 🎯 **Accessibility Pattern**: The "skip link" is essential for keyboard users. It should be the first focusable element on your page and jump directly to the main content area.

✅ **Implement skip navigation**: Add skip links to your pages and test them by pressing Tab as soon as the page loads. They should appear and allow you to jump to main content.

## Crafting Meaningful Link Text

Links are basically the highways of the web, but poorly written link text is like having road signs that just say "Place" instead of "Downtown Chicago." Not very helpful, right?

Here''s something that blew my mind when I first learned it: screen readers can extract all the links from a page and show them as one big list. Imagine if someone handed you a directory of every link on your page. Would each one make sense on its own? That''s the test your link text needs to pass!

### Understanding link navigation patterns

Screen readers offer powerful link navigation features that rely on well-written link text:

**Link navigation methods:**
- **Sequential reading**: Links are read in context as part of content flow
- **Link list generation**: All page links compiled into a searchable directory
- **Quick navigation**: Jump between links using keyboard shortcuts (K in NVDA)
- **Search functionality**: Find specific links by typing partial text

**Why context matters:**
When screen reader users generate a link list, they see something like this:
- "Download report"
- "Learn more"
- "Click here"
- "Privacy policy"
- "Click here"

Only two of these links provide useful information when read out of context!

> 📊 **User Impact**: Screen reader users scan link lists to understand page content quickly. Generic link text forces them to navigate back to each link''s context, significantly slowing down their browsing experience.

### Common link text mistakes to avoid

Understanding what doesn''t work helps you recognize and fix accessibility issues in existing content.

**❌ Generic link text that provides no context:**

```html

Our sustainability efforts are detailed in our recent report. 
   Click here to view it.



  Web Accessibility Guide
  Learn the fundamentals...
  Read more


  Color Contrast Tips
  Improve your design...
  Read more



Visit https://www.w3.org/WAI/WCAG21/quickref/ for WCAG guidelines.


Go | See | View
```

**Why these patterns fail:**
- **"Click here"** tells users nothing about the destination
- **"Read more"** repeated multiple times creates confusion
- **Raw URLs** are difficult for screen readers to pronounce clearly
- **Single words** like "Go" or "See" lack descriptive context

### Writing excellent link text

Descriptive link text benefits everyone—sighted users can quickly scan links, and screen reader users understand destinations immediately.

**✅ Clear, descriptive link text examples:**

```html

Our comprehensive 2024 sustainability report (PDF, 2.1MB) details our environmental initiatives.



  Web Accessibility Guide
  Learn the fundamentals of inclusive design...
  Read our complete web accessibility guide


  Color Contrast Tips
  Improve your design with better color choices...
  Explore color contrast best practices



The WCAG 2.1 Quick Reference guide provides comprehensive accessibility guidelines.


Contact our support team | 
About our company | 
Get help with your account
```

**Link text best practices:**
- **Be specific**: "Download the quarterly financial report" vs. "Download"
- **Include file type and size**: "(PDF, 1.2MB)" for downloadable files
- **Mention if links open externally**: "(opens in new window)" when appropriate
- **Use active language**: "Contact us" vs. "Contact page"
- **Keep it concise**: Aim for 2-8 words when possible

### Advanced link accessibility patterns

Sometimes visual design constraints or technical requirements need special solutions. Here are sophisticated techniques for common challenging scenarios:

**Using ARIA for enhanced context:**

```html


  Download Report



Sustainability Initiative
Our efforts to reduce environmental impact...

  Learn more

Detailed breakdown of our 2024 environmental goals and achievements
```

**Indicating file types and external destinations:**

```html


  Download our 2024 annual report (PDF, 2.3MB)




  Download our 2024 annual report
  (PDF format, 2.3MB)




  Visit external resource


  (opens in new window)




  External resource

```

```css
/* Visual indicator for external links */
.external-link::after {
  content: " ↗";
  font-size: 0.8em;
  color: #666;
}

/* Screen reader announcement for external links */
.external-link::before {
  content: "External link: ";
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
```

> ⚠️ **Important**: When using `target="_blank"`, always inform users that the link opens in a new window or tab. Unexpected navigation changes can be disorienting.

✅ **Test your link context**: Use your browser''s developer tools to generate a list of all links on your page. Can you understand each link''s purpose without any surrounding context?

## ARIA: Supercharging HTML Accessibility

Accessible Rich Internet Applications (ARIA) (https://developer.mozilla.org/docs/Web/Accessibility/ARIA) is like having a universal translator between your complex web applications and assistive technologies. When HTML alone can''t express everything your interactive components are doing, ARIA steps in to fill those gaps.

I like to think of ARIA as adding helpful annotations to your HTML—kind of like stage directions in a play script that help actors understand their roles and relationships.

**Here''s the most important rule about ARIA**: Always use semantic HTML first, then add ARIA to enhance it. Think of ARIA as seasoning, not the main dish. It should clarify and enhance your HTML structure, never replace it. Get that foundation right first!

### Strategic ARIA implementation

ARIA is powerful, but with power comes responsibility. Incorrect ARIA can make accessibility worse than no ARIA at all. Here''s when and how to use it effectively:

**✅ Use ARIA when:**
- Creating custom interactive widgets (accordions, tabs, carousels)
- Building dynamic content that changes without page reloads
- Providing additional context for complex UI relationships
- Indicating loading states or live content updates
- Creating app-like interfaces with custom controls

**❌ Avoid ARIA when:**
- Standard HTML elements already provide the needed semantics
- You''re unsure how to implement it correctly
- It duplicates information already provided by semantic HTML
- You haven''t tested with actual assistive technology

> 🎯 **ARIA Golden Rule**: "Don''t change semantics unless you absolutely have to, ensure keyboard accessibility always, and test with real assistive technology."

**The five categories of ARIA:**

1. **Roles**: What is this element? (`button`, `tab`, `dialog`)
2. **Properties**: What are its features? (`aria-required`, `aria-haspopup`)
3. **States**: What''s its current condition? (`aria-expanded`, `aria-checked`)
4. **Landmarks**: Where is it in page structure? (`banner`, `navigation`, `main`)
5. **Live regions**: How should changes be announced? (`aria-live`, `aria-atomic`)

### Essential ARIA patterns for modern web apps

These patterns solve the most common accessibility challenges in interactive web applications:

**Naming and describing elements:**

```html

×



  Latest News
  





  Password must contain at least 8 characters, including uppercase, lowercase, and numbers.


  

```

**Live regions for dynamic content:**

```html


  




  




  Submit Application


  

```

**Interactive widget example (accordion):**

```html

  
    
      Accessibility Guidelines
    
  
  
    WCAG 2.1 provides comprehensive guidelines...
  

```

```javascript
// JavaScript to manage accordion state
function toggleAccordion(trigger) {
  const panel = document.getElementById(trigger.getAttribute(''aria-controls''));
  const isExpanded = trigger.getAttribute(''aria-expanded'') === ''true'';
  
  // Toggle states
  trigger.setAttribute(''aria-expanded'', !isExpanded);
  panel.hidden = isExpanded;
  
  // Announce change to screen readers
  const status = document.getElementById(''status-updates'');
  status.textContent = isExpanded ? ''Section collapsed'' : ''Section expanded'';
}
```

### ARIA implementation best practices

ARIA is powerful but requires careful implementation. Following these guidelines helps ensure your ARIA enhances rather than hinders accessibility:

**🛡️ Core principles:**

```mermaid
flowchart TD
    A[🚀 Start with semantic HTML] --> B{Does HTML provide needed semantics?}
    B -->|Yes| C[✅ Use HTML only]
    B -->|No| D[Consider ARIA enhancement]
    D --> E{Can you achieve it with simpler means?}
    E -->|Yes| F[🔄 Simplify approach]
    E -->|No| G[📝 Implement ARIA carefully]
    G --> H[🧪 Test with real AT]
    H --> I{Works as expected?}
    I -->|No| J[🔧 Debug and fix]
    I -->|Yes| K[✅ Success!]
    J --> H
    F --> C
    
    style A fill:#e3f2fd
    style C fill:#e8f5e8
    style K fill:#e8f5e8
    style G fill:#fff3e0
    style H fill:#f3e5f5
```

1. **Semantic HTML first**: Always prefer `` over ``
2. **Don''t break semantics**: Never override existing HTML meaning (avoid ``)
3. **Maintain keyboard accessibility**: All interactive ARIA elements must be fully keyboard accessible
4. **Test with real users**: ARIA support varies significantly between assistive technologies
5. **Start simple**: Complex ARIA implementations are more likely to have errors

**🔍 Testing workflow:**

```mermaid
graph TD
    A[Write ARIA code] --> B[Validate HTML]
    B --> C[Test with keyboard only]
    C --> D[Test with screen reader]
    D --> E[Test across browsers]
    E --> F{Issues found?}
    F -->|Yes| G[Fix and re-test]
    F -->|No| H[Implementation complete]
    G --> B
```

**🚫 Common ARIA mistakes to avoid:**

- **Conflicting information**: Don''t contradict HTML semantics
- **Over-labeling**: Too much ARIA information overwhelms users
- **Static ARIA**: Forgetting to update ARIA states when content changes
- **Untested implementations**: ARIA that works in theory but fails in practice
- **Missing keyboard support**: ARIA roles without corresponding keyboard interactions

> 💡 **Testing Resources**: Use tools like accessibility-checker (https://www.npmjs.com/package/accessibility-checker) for automated ARIA validation, but always test with real screen readers for the complete experience.

### 🎭 **ARIA Skills Check: Ready for Complex Interactions?**

**Gauge your ARIA confidence:**
- When would you choose ARIA over semantic HTML? (Hint: almost never!)
- Can you explain why `` is usually worse than ``?
- What''s the most important thing to remember about ARIA testing?

```mermaid
pie title "Common ARIA Usage Patterns"
    "Labels & Descriptions" : 40
    "Live Regions" : 25
    "Widget States" : 20
    "Complex Controls" : 15
```

> **Key insight**: Most ARIA usage is for labeling and describing elements. Complex widget patterns are much less common than you might think!

✅ **Learn from experts**: Study the ARIA Authoring Practices Guide (https://w3c.github.io/aria-practices/) for battle-tested patterns and implementations of complex interactive widgets.

## Making Images and Media Accessible

Visual and audio content are essential parts of modern web experiences, but they can create barriers if not implemented thoughtfully. The goal is ensuring that the information and emotional impact of your media reaches every user. Once you get the hang of it, it becomes second nature.

Different types of media need different accessibility approaches. It''s like cooking—you wouldn''t treat a delicate fish the same way you''d treat a hearty steak. Understanding these distinctions helps you choose the right solution for each situation.

### Strategic image accessibility

Every image on your website serves a purpose. Understanding that purpose helps you write better alternative text and create more inclusive experiences.

**The four types of images and their alt text strategies:**

**Informative images** - convey important information:
```html

```

**Decorative images** - purely visual with no informational value:
```html

```

**Functional images** - serve as buttons or controls:
```html

  

```

**Complex images** - charts, diagrams, infographics:
```html


  Detailed description: Sales data shows a steady increase across all quarters...

```

### Video and audio accessibility

**Video requirements:**
- **Captions**: Text version of spoken content and sound effects
- **Audio descriptions**: Narration of visual elements for blind users
- **Transcripts**: Full text version of all audio and visual content

```html

  
  
  

```

**Audio requirements:**
- **Transcripts**: Text version of all spoken content
- **Visual indicators**: For audio-only content, provide visual cues

### Modern image techniques

**Using CSS for decorative images:**
```css
.hero-section {
  background-image: url(''decorative-hero.jpg'');
  /* Decorative images in CSS don''t need alt text */
}
```

**Responsive images with accessibility:**
```html

  
  
  

```

✅ **Test image accessibility**: Use a screen reader to navigate a page with images. Are you getting enough information to understand the content?

## Keyboard navigation and focus management

Many users navigate the web entirely with their keyboards. This includes people with motor disabilities, power users who find keyboards faster than mice, and anyone whose mouse has stopped working. Making sure your site works well with keyboard input is essential and often makes your site more efficient for everyone.

```mermaid
flowchart LR
    A[⌨️ Keyboard Navigation] --> B[Tab Order]
    A --> C[Focus Indicators]
    A --> D[Skip Links]
    A --> E[Keyboard Shortcuts]
    
    B --> B1[Logical sequenceAll interactive elementsNo tab traps]
    C --> C1[Visible outlinesHigh contrastClear boundaries]
    D --> D1[Skip to mainSkip to navBypass repetitive]
    E --> E1[Escape to closeEnter to activateArrows in groups]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e0f2f1
```

### Essential keyboard navigation patterns

**Standard keyboard interactions:**
- **Tab**: Move focus forward through interactive elements
- **Shift + Tab**: Move focus backward
- **Enter**: Activate buttons and links
- **Space**: Activate buttons, check checkboxes
- **Arrow keys**: Navigate within component groups (radio buttons, menus)
- **Escape**: Close modals, dropdowns, or cancel operations

### Focus management best practices

**Visible focus indicators:**
```css
/* Ensure focus is always visible */
button:focus-visible {
  outline: 2px solid #4A90A4;
  outline-offset: 2px;
}

/* Custom focus styles for different components */
.card:focus-within {
  box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.5);
}
```

**Skip links for efficient navigation:**
```html
Skip to main content
Skip to navigation


  


  

```

**Proper tab order:**
```html


  Name:
  
  
  Email:
  
  
  Submit

```

### Focus trapping in modals

When opening modal dialogs, focus should be trapped within the modal:

```javascript
// Modern focus trap implementation
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    ''button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])''
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  element.addEventListener(''keydown'', (e) => {
    if (e.key === ''Tab'') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
    
    if (e.key === ''Escape'') {
      closeModal();
    }
  });
  
  // Focus first element when modal opens
  firstElement.focus();
}
```

✅ **Test keyboard navigation**: Try navigating your website using only the Tab key. Can you reach all interactive elements? Is the focus order logical? Are focus indicators clearly visible?

## Form accessibility

Forms are critical for user interaction and require special attention to accessibility.

### Label and form control association

**Every form control needs a label:**
```html

Username:




  Password:
  




```

### Error handling and validation

**Accessible error messages:**
```html
Email Address:


  Please enter a valid email address

```

**Form validation best practices:**
- Use `aria-invalid` to indicate invalid fields
- Provide clear, specific error messages
- Use `role="alert"` for important error announcements
- Show errors both immediately and on form submission

### Fieldsets and grouping

**Group related form controls:**
```html

  Shipping Address
  Street Address:
  
  
  City:
  



  Preferred Contact Method
  
  Email
  
  
  Phone

```

## Your Accessibility Journey: Key Takeaways

Congratulations! You''ve just gained the foundational knowledge to create truly inclusive web experiences. This is pretty exciting stuff! Web accessibility isn''t just about checking compliance boxes—it''s about recognizing the diverse ways people interact with digital content and designing for that amazing complexity.

You''re now part of a growing community of developers who understand that great design works for everyone. Welcome to the club!

**🎯 Your accessibility toolkit now includes:**

| Core Principle | Implementation | Impact |
|----------------|----------------|---------|
| **Semantic HTML Foundation** | Use proper HTML elements for their intended purpose | Screen readers can navigate efficiently, keyboards work automatically |
| **Inclusive Visual Design** | Sufficient contrast, meaningful color use, visible focus indicators | Clear for everyone in any lighting condition |
| **Descriptive Content** | Meaningful link text, alt text, headings | Users understand content without visual context |
| **Keyboard Accessibility** | Tab order, keyboard shortcuts, focus management | Motor accessibility and power user efficiency |
| **ARIA Enhancement** | Strategic use to fill semantic gaps | Complex applications work with assistive technologies |
| **Comprehensive Testing** | Automated tools + manual verification + real user testing | Catch issues before they impact users |

**🚀 Your next steps:**

1. **Build accessibility into your workflow**: Make testing a natural part of your development process
2. **Learn from real users**: Seek out feedback from people who use assistive technologies
3. **Stay current**: Accessibility techniques evolve with new technologies and standards
4. **Advocate for inclusion**: Share your knowledge and make accessibility a team priority

> 💡 **Remember**: Accessibility constraints often lead to innovative, elegant solutions that benefit everyone. Curb cuts, captions, and voice controls all started as accessibility features and became mainstream improvements.

**The business case is crystal clear**: Accessible websites reach more users, rank better in search engines, have lower maintenance costs, and avoid legal risks. But honestly? The real reason to care about accessibility goes so much deeper. Accessible websites embody the best values of the web—openness, inclusivity, and the idea that everyone deserves equal access to information.

You''re now equipped to build the inclusive web of the future. Every accessible site you create makes the internet a more welcoming place for everyone. That''s pretty amazing when you think about it!

## Additional Resources

Continue your accessibility learning journey with these essential resources:

**📚 Official Standards and Guidelines:**
- WCAG 2.1 Guidelines (https://www.w3.org/WAI/WCAG21/quickref/) - The official accessibility standard with quick reference
- ARIA Authoring Practices Guide (https://w3c.github.io/aria-practices/) - Comprehensive patterns for interactive widgets
- WebAIM Guidelines (https://webaim.org/) - Practical, beginner-friendly accessibility guidance

**🛠️ Tools and Testing Resources:**
- axe DevTools (https://www.deque.com/axe/devtools/) - Industry-standard accessibility testing
- A11y Project Checklist (https://www.a11yproject.com/checklist/) - Step-by-step accessibility verification
- Accessibility Insights (https://accessibilityinsights.io/) - Microsoft''s comprehensive testing suite
- Color Oracle (https://colororacle.org/) - Color blindness simulator for design testing

**🎓 Learning and Community:**
- WebAIM Screen Reader Survey (https://webaim.org/projects/screenreadersurvey9/) - Real user preferences and behaviors
- Inclusive Components (https://inclusive-components.design/) - Modern accessible component patterns
- A11y Coffee (https://a11y.coffee/) - Quick accessibility tips and insights
- Web Accessibility Initiative (WAI) (https://www.w3.org/WAI/) - W3C''s comprehensive accessibility resources

**🎥 Hands-on Learning:**
- Accessibility Developer Guide (https://www.accessibility-developer-guide.com/) - Practical implementation guidance
- Deque University (https://dequeuniversity.com/) - Professional accessibility training courses

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Create an accessible modal dialog component that demonstrates proper focus management, ARIA attributes, and keyboard navigation patterns.

**Prompt:** Build a complete modal dialog component with HTML, CSS, and JavaScript that includes: proper focus trapping, ESC key to close, click outside to close, ARIA attributes for screen readers, and visible focus indicators. The modal should contain a form with proper labels and error handling. Ensure the component meets WCAG 2.1 AA standards.


## 🚀 Challenge

Take this HTML and rewrite it to be as accessible as possible, given the strategies you learned.

```html


  
    
    
    Turtle Ipsum - The World''s Premier Turtle Fan Club
    
  
  
    
      Turtle Ipsum
      The World''s Premier Turtle Fan Club
    
    
    
      Resources
      
        "I like turtles" video
        Basic turtle information
        Chocolate turtles candy
      
    
    
    
      
        Welcome to Turtle Ipsum
        
          Learn more about our turtle community and discover fascinating facts about these amazing creatures.
        
        
          Turtle ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        
      
    
    
    
      
        Stay Updated
        Sign up for turtle news
      
      
      
        Site Pages
        
          Home
          Semantic HTML example
        
      
      
      &copy; 2024 Instrument. All rights reserved.
    
  

```

**Key improvements made:**
- Added proper semantic HTML structure
- Fixed heading hierarchy (single h1, logical progression)
- Added meaningful link text instead of "click here"
- Included proper ARIA labels for navigation
- Added lang attribute and proper meta tags
- Used button element for interactive elements
- Structured footer content with proper landmarks

## Post-Lecture Quiz
Post-lecture quiz (https://ff-quizzes.netlify.app/web/en/)

## Review & Self Study

Many governments have laws regarding accessibility requirements. Read up on your home country''s accessibility laws. What is covered, and what isn''t? An example is this government web site (https://accessibility.blog.gov.uk/).

## Assignment
 
Analyze a non-accessible web site (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/1-getting-started-lessons/3-accessibility/assignment.md)

Credits: Turtle Ipsum (https://github.com/Instrument/semantic-html-sample) by Instrument

---

## 🚀 Your Accessibility Mastery Timeline

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Install axe DevTools extension in your browser
- [ ] Run a Lighthouse accessibility audit on your favorite website
- [ ] Try navigating any website using only the Tab key
- [ ] Test your browser''s built-in screen reader (Narrator/VoiceOver)

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and reflect on accessibility insights
- [ ] Practice writing meaningful alt text for 10 different images
- [ ] Audit a website''s heading structure using HeadingsMap extension
- [ ] Fix accessibility issues found in the challenge HTML
- [ ] Test color contrast on your current project with WebAIM''s tool

### 📅 **Your Week-Long Accessibility Journey**
- [ ] Complete the assignment analyzing a non-accessible website
- [ ] Set up your development environment with accessibility testing tools
- [ ] Practice keyboard navigation on 5 different complex websites
- [ ] Build a simple form with proper labels, error handling, and ARIA
- [ ] Join an accessibility community (A11y Slack, WebAIM forum)
- [ ] Watch real users with disabilities navigate websites (YouTube has great examples)

### 🌟 **Your Month-Long Transformation**
- [ ] Integrate accessibility testing into your development workflow
- [ ] Contribute to an open source project by fixing accessibility issues
- [ ] Conduct usability testing with someone who uses assistive technology
- [ ] Build an accessible component library for your team
- [ ] Advocate for accessibility in your workplace or community
- [ ] Mentor someone new to accessibility concepts

### 🏆 **Final Accessibility Champion Check-in**

**Celebrate your accessibility journey:**
- What''s the most surprising thing you learned about how people use the web?
- Which accessibility principle resonates most with your development style?
- How has learning about accessibility changed your perspective on design?
- What''s the first accessibility improvement you want to make on a real project?

```mermaid
journey
    title Your Accessibility Confidence Evolution
    section Today
      Overwhelmed: 3: You
      Curious: 4: You
      Motivated: 5: You
    section This Week
      Practicing: 4: You
      Testing: 5: You
      Understanding: 5: You
    section Next Month
      Advocating: 5: You
      Leading: 5: You
      Inclusive by Default: 5: You
```

> 🌍 **You''re now an accessibility champion!** You understand that great web experiences work for everyone, regardless of how they access the web. Every accessible feature you build makes the internet more inclusive. The web needs developers like you who see accessibility not as a constraint, but as an opportunity to create better experiences for all users. Welcome to the movement! 🎉',38);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'web-development-foundations-4','Terrarium Project Part 1: Introduction to HTML',4,'# Terrarium Project Part 1: Introduction to HTML

```mermaid
journey
    title Your HTML Learning Journey
    section Foundation
      Create HTML file: 3: Student
      Add DOCTYPE: 4: Student
      Structure document: 5: Student
    section Content
      Add metadata: 4: Student
      Include images: 5: Student
      Organize layout: 5: Student
    section Semantics
      Use proper tags: 4: Student
      Enhance accessibility: 5: Student
      Build terrarium: 5: Student
```


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

HTML, or HyperText Markup Language, is the foundation of every website you''ve ever visited. Think of HTML as the skeleton that gives structure to web pages – it defines where content goes, how it''s organized, and what each piece represents. While CSS will later "dress up" your HTML with colors and layouts, and JavaScript will bring it to life with interactivity, HTML provides the essential structure that makes everything else possible.

In this lesson, you''ll create the HTML structure for a virtual terrarium interface. This hands-on project will teach you fundamental HTML concepts while building something visually engaging. You''ll learn how to organize content using semantic elements, work with images, and create the foundation for an interactive web application.

By the end of this lesson, you''ll have a working HTML page displaying plant images in organized columns, ready for styling in the next lesson. Don''t worry if it looks basic at first – that''s exactly what HTML should do before CSS adds the visual polish.

```mermaid
mindmap
  root((HTML Fundamentals))
    Structure
      DOCTYPE Declaration
      HTML Element
      Head Section
      Body Content
    Elements
      Tags & Attributes
      Self-closing Tags
      Nested Elements
      Block vs Inline
    Content
      Text Elements
      Images
      Containers (div)
      Lists
    Semantics
      Meaningful Tags
      Accessibility
      Screen Readers
      SEO Benefits
    Best Practices
      Proper Nesting
      Valid Markup
      Descriptive Alt Text
      Organized Structure
```

## Pre-Lecture Quiz

Pre-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/15)

> 📺 **Watch and Learn**: Check out this helpful video overview
> 
> [](https://www.youtube.com/watch?v=1TvxJKBzhyQ)

## Setting Up Your Project

Before we dive into HTML code, let''s set up a proper workspace for your terrarium project. Creating an organized file structure from the beginning is a crucial habit that will serve you well throughout your web development journey.

### Task: Create Your Project Structure

You''ll create a dedicated folder for your terrarium project and add your first HTML file. Here are two approaches you can use:

**Option 1: Using Visual Studio Code**
1. Open Visual Studio Code
2. Click "File" → "Open Folder" or use `Ctrl+K, Ctrl+O` (Windows/Linux) or `Cmd+K, Cmd+O` (Mac)
3. Create a new folder called `terrarium` and select it
4. In the Explorer pane, click the "New File" icon
5. Name your file `index.html`



**Option 2: Using Terminal Commands**
```bash
mkdir terrarium
cd terrarium
touch index.html
code index.html
```

**Here''s what these commands accomplish:**
- **Creates** a new directory called `terrarium` for your project
- **Navigates** into the terrarium directory 
- **Creates** an empty `index.html` file
- **Opens** the file in Visual Studio Code for editing

> 💡 **Pro Tip**: The filename `index.html` is special in web development. When someone visits a website, browsers automatically look for `index.html` as the default page to display. This means a URL like `https://mysite.com/projects/` will automatically serve the `index.html` file from the `projects` folder without needing to specify the filename in the URL.

## Understanding HTML Document Structure

Every HTML document follows a specific structure that browsers need to understand and display correctly. Think of this structure like a formal letter – it has required elements in a particular order that help the recipient (in this case, the browser) process the content properly.

```mermaid
flowchart TD
    A[""] --> B[""]
    B --> C[""]
    C --> D[""]
    C --> E[""]
    C --> F[""]
    B --> G[""]
    G --> H[" Heading"]
    G --> I[" Containers"]
    G --> J[" Images"]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style G fill:#e8f5e8
```

Let''s start by adding the essential foundation that every HTML document needs.

### The DOCTYPE Declaration and Root Element

The first two lines of any HTML file serve as the document''s "introduction" to the browser:

```html


```

**Understanding what this code does:**
- **Declares** the document type as HTML5 using ``
- **Creates** the root `` element that will contain all page content
- **Establishes** modern web standards for proper browser rendering
- **Ensures** consistent display across different browsers and devices

> 💡 **VS Code Tip**: Hover over any HTML tag in VS Code to see helpful information from MDN Web Docs, including usage examples and browser compatibility details.

> 📚 **Learn More**: The DOCTYPE declaration prevents browsers from entering "quirks mode," which was used to support very old websites. Modern web development uses the simple `` declaration to ensure standards-compliant rendering (https://developer.mozilla.org/docs/Web/HTML/Quirks_Mode_and_Standards_Mode).

### 🔄 **Pedagogical Check-in**
**Pause and Reflect**: Before continuing, make sure you understand:
- ✅ Why every HTML document needs a DOCTYPE declaration
- ✅ What the `` root element contains
- ✅ How this structure helps browsers render pages correctly

**Quick Self-Test**: Can you explain in your own words what "standards-compliant rendering" means?

## Adding Essential Document Metadata

The `` section of an HTML document contains crucial information that browsers and search engines need, but that visitors don''t see directly on the page. Think of it as the "behind-the-scenes" information that helps your webpage work properly and appear correctly across different devices and platforms.

This metadata tells browsers how to display your page, what character encoding to use, and how to handle different screen sizes – all essential for creating professional, accessible web pages.

### Task: Add the Document Head

Insert this `` section between your opening and closing `` tags:

```html

	Welcome to my Virtual Terrarium
	
	
	

```

**Breaking down what each element accomplishes:**
- **Sets** the page title that appears in browser tabs and search results
- **Specifies** UTF-8 character encoding for proper text display worldwide
- **Ensures** compatibility with modern versions of Internet Explorer
- **Configures** responsive design by setting the viewport to match device width
- **Controls** initial zoom level to display content at natural size

> 🤔 **Think About This**: What would happen if you set a viewport meta tag like this: ``? This would force the page to always be 600 pixels wide, breaking responsive design! Learn more about proper viewport configuration (https://developer.mozilla.org/docs/Web/HTML/Viewport_meta_tag).

## Building the Document Body

The `` element contains all the visible content of your webpage – everything users will see and interact with. While the `` section provided instructions to the browser, the `` section contains the actual content: text, images, buttons, and other elements that create your user interface.

Let''s add the body structure and understand how HTML tags work together to create meaningful content.

### Understanding HTML Tag Structure

HTML uses paired tags to define elements. Most tags have an opening tag like `` and a closing tag like ``, with content in between: `Hello, world!`. This creates a paragraph element containing the text "Hello, world!".

### Task: Add the Body Element

Update your HTML file to include the `` element:

```html


	
		Welcome to my Virtual Terrarium
		
		
		
	
	

```

**Here''s what this complete structure provides:**
- **Establishes** the basic HTML5 document framework
- **Includes** essential metadata for proper browser rendering
- **Creates** an empty body ready for your visible content
- **Follows** modern web development best practices

Now you''re ready to add the visible elements of your terrarium. We''ll use `` elements as containers to organize different sections of content, and `` elements to display the plant images.

### Working with Images and Layout Containers

Images are special in HTML because they use "self-closing" tags. Unlike elements like `` that wrap around content, the `` tag contains all the information it needs within the tag itself using attributes like `src` for the image file path and `alt` for accessibility.

Before adding images to your HTML, you''ll need to organize your project files properly by creating an images folder and adding the plant graphics.

**First, set up your images:**
1. Create a folder called `images` inside your terrarium project folder
2. Download the plant images from the solution folder (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/3-terrarium/solution/images) (14 plant images total)
3. Copy all plant images into your new `images` folder

### Task: Create the Plant Display Layout

Now add the plant images organized in two columns between your `` tags:

```html

	
		
			
		
		
			
		
		
			
		
		
			
		
		
			
		
		
			
		
		
			
		
	
	
		
			
		
		
			
		
		
			
		
		
			
		
		
			
		
		
			
		
		
			
		
	

```

**Step by step, here''s what''s happening in this code:**
- **Creates** a main page container with `id="page"` to hold all content
- **Establishes** two column containers: `left-container` and `right-container`
- **Organizes** 7 plants in the left column and 7 plants in the right column
- **Wraps** each plant image in a `plant-holder` div for individual positioning
- **Applies** consistent class names for CSS styling in the next lesson
- **Assigns** unique IDs to each plant image for JavaScript interaction later
- **Includes** proper file paths pointing to the images folder

> 🤔 **Consider This**: Notice that all images currently have the same alt text "plant". This isn''t ideal for accessibility. Screen reader users would hear "plant" repeated 14 times without knowing which specific plant each image shows. Can you think of better, more descriptive alt text for each image?

> 📝 **HTML Element Types**: `` elements are "block-level" and take up full width, while `` elements are "inline" and only take up necessary width. What do you think would happen if you changed all these `` tags to `` tags?

### 🔄 **Pedagogical Check-in**
**Structure Understanding**: Take a moment to review your HTML structure:
- ✅ Can you identify the main containers in your layout?
- ✅ Do you understand why each image has a unique ID?
- ✅ How would you describe the purpose of the `plant-holder` divs?

**Visual Inspection**: Open your HTML file in a browser. You should see:
- A basic list of plant images
- Images organized in two columns
- Simple, unstyled layout

**Remember**: This plain appearance is exactly what HTML should look like before CSS styling!

With this markup added, the plants will appear on screen, though they won''t look polished yet – that''s what CSS is for in the next lesson! For now, you have a solid HTML foundation that properly organizes your content and follows accessibility best practices.

## Using Semantic HTML for Accessibility

Semantic HTML means choosing HTML elements based on their meaning and purpose, not just their appearance. When you use semantic markup, you''re communicating the structure and meaning of your content to browsers, search engines, and assistive technologies like screen readers.

```mermaid
flowchart TD
    A[Need to add content?] --> B{What type?}
    B -->|Main heading| C[""]
    B -->|Subheading| D[", , etc."]
    B -->|Paragraph| E[""]
    B -->|List| F[", "]
    B -->|Navigation| G[""]
    B -->|Article| H[""]
    B -->|Section| I[""]
    B -->|Generic container| J[""]
    
    C --> K[Screen readers announce as main title]
    D --> L[Creates proper heading hierarchy]
    E --> M[Provides proper text spacing]
    F --> N[Enables list navigation shortcuts]
    G --> O[Identifies navigation landmarks]
    H --> P[Marks standalone content]
    I --> Q[Groups related content]
    J --> R[Use only when no semantic tag fits]
    
    style C fill:#4caf50
    style D fill:#4caf50
    style E fill:#4caf50
    style F fill:#4caf50
    style G fill:#2196f3
    style H fill:#2196f3
    style I fill:#2196f3
    style J fill:#ff9800
```

This approach makes your websites more accessible to users with disabilities and helps search engines better understand your content. It''s a fundamental principle of modern web development that creates better experiences for everyone.

### Adding a Semantic Page Title

Let''s add a proper heading to your terrarium page. Insert this line right after your opening `` tag:

```html
My Terrarium
```

**Why semantic markup matters:**
- **Helps** screen readers navigate and understand page structure
- **Improves** search engine optimization (SEO) by clarifying content hierarchy
- **Enhances** accessibility for users with visual impairments or cognitive differences
- **Creates** better user experiences across all devices and platforms
- **Follows** web standards and best practices for professional development

**Examples of semantic vs. non-semantic choices:**

| Purpose | ✅ Semantic Choice | ❌ Non-Semantic Choice |
|---------|-------------------|------------------------|
| Main heading | `Title` | `Title` |
| Navigation | `` | `` |
| Button | `Click me` | `Click me` |
| Article content | `` | `` |

> 🎥 **See It in Action**: Watch how screen readers interact with web pages (https://www.youtube.com/watch?v=OUDV1gqs9GA) to understand why semantic markup is crucial for accessibility. Notice how proper HTML structure helps users navigate efficiently.

## Creating the Terrarium Container

Now let''s add the HTML structure for the terrarium itself – the glass container where plants will eventually be placed. This section demonstrates an important concept: HTML provides structure, but without CSS styling, these elements won''t be visible yet.

The terrarium markup uses descriptive class names that will make CSS styling intuitive and maintainable in the next lesson.

### Task: Add the Terrarium Structure

Insert this markup above the last `` tag (before the closing tag of the page container):

```html

	
	
		
		
	
	
	

```

**Understanding this terrarium structure:**
- **Creates** a main terrarium container with a unique ID for styling
- **Defines** separate elements for each visual component (top, walls, dirt, bottom)
- **Includes** nested elements for glass reflection effects (glossy elements)
- **Uses** descriptive class names that clearly indicate each element''s purpose
- **Prepares** the structure for CSS styling that will create the glass terrarium appearance

> 🤔 **Notice Something?**: Even though you added this markup, you don''t see anything new on the page! This perfectly illustrates how HTML provides structure while CSS provides appearance. These `` elements exist but have no visual styling yet – that''s coming in the next lesson!

```mermaid
flowchart TD
    A[HTML Document] --> B[Document Head]
    A --> C[Document Body]
    B --> D[Title Element]
    B --> E[Meta Charset]
    B --> F[Meta Viewport]
    C --> G[Main Heading]
    C --> H[Page Container]
    H --> I[Left Container with 7 plants]
    H --> J[Right Container with 7 plants]
    H --> K[Terrarium Structure]
    
    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#e8f5e8
    style H fill:#f3e5f5
```

### 🔄 **Pedagogical Check-in**
**HTML Structure Mastery**: Before moving forward, ensure you can:
- ✅ Explain the difference between HTML structure and visual appearance
- ✅ Identify semantic vs. non-semantic HTML elements
- ✅ Describe how proper markup benefits accessibility
- ✅ Recognize the complete document tree structure

**Testing Your Understanding**: Try opening your HTML file in a browser with JavaScript disabled and CSS removed. This shows you the pure semantic structure you''ve created!

---

## GitHub Copilot Agent Challenge

Use the Agent mode to complete the following challenge:

**Description:** Create a semantic HTML structure for a plant care guide section that could be added to the terrarium project.

**Prompt:** Create a semantic HTML section that includes a main heading "Plant Care Guide", three subsections with headings "Watering", "Light Requirements", and "Soil Care", each containing a paragraph of plant care information. Use proper semantic HTML tags like ``, ``, ``, and `` to structure the content appropriately.

Learn more about agent mode (https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) here.

## Explore HTML History Challenge

**Learning About Web Evolution**

HTML has evolved significantly since Tim Berners-Lee created the first web browser at CERN in 1990. Some older tags like `` are now deprecated because they don''t work well with modern accessibility standards and responsive design principles.

**Try This Experiment:**
1. Temporarily wrap your `` title in a `` tag: `My Terrarium`
2. Open your page in a browser and observe the scrolling effect
3. Consider why this tag was deprecated (hint: think about user experience and accessibility)
4. Remove the `` tag and return to semantic markup

**Reflection Questions:**
- How might a scrolling title affect users with visual impairments or motion sensitivity?
- What modern CSS techniques could achieve similar visual effects more accessibly?
- Why is it important to use current web standards instead of deprecated elements?

Explore more about obsolete and deprecated HTML elements (https://developer.mozilla.org/docs/Web/HTML/Element#Obsolete_and_deprecated_elements) to understand how web standards evolve to improve user experience.


## Post-Lecture Quiz

Post-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/16)

## Review & Self Study

**Deepen Your HTML Knowledge**

HTML has been the foundation of the web for over 30 years, evolving from a simple document markup language to a sophisticated platform for building interactive applications. Understanding this evolution helps you appreciate modern web standards and make better development decisions.

**Recommended Learning Paths:**

1. **HTML History and Evolution**
   - Research the timeline from HTML 1.0 to HTML5
   - Explore why certain tags were deprecated (accessibility, mobile-friendliness, maintainability)
   - Investigate emerging HTML features and proposals

2. **Semantic HTML Deep Dive**
   - Study the complete list of HTML5 semantic elements (https://developer.mozilla.org/docs/Web/HTML/Element)
   - Practice identifying when to use ``, ``, ``, and ``
   - Learn about ARIA attributes for enhanced accessibility

3. **Modern Web Development**
   - Explore building responsive websites (https://docs.microsoft.com/learn/modules/build-simple-website/?WT.mc_id=academic-77807-sagibbon) on Microsoft Learn
   - Understand how HTML integrates with CSS and JavaScript
   - Learn about web performance and SEO best practices

**Reflection Questions:**
- Which deprecated HTML tags did you discover, and why were they removed?
- What new HTML features are being proposed for future versions?
- How does semantic HTML contribute to web accessibility and SEO?

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Open DevTools (F12) and inspect the HTML structure of your favorite website
- [ ] Create a simple HTML file with basic tags: ``, ``, and ``
- [ ] Validate your HTML using the W3C HTML Validator online
- [ ] Try adding a comment to your HTML using ``

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and review semantic HTML concepts
- [ ] Build a simple webpage about yourself using proper HTML structure
- [ ] Experiment with different heading levels and text formatting tags
- [ ] Add images and links to practice multimedia integration
- [ ] Research HTML5 features you haven''t tried yet

### 📅 **Your Week-Long HTML Journey**
- [ ] Complete the terrarium project assignment with semantic markup
- [ ] Create an accessible webpage using ARIA labels and roles
- [ ] Practice form creation with various input types
- [ ] Explore HTML5 APIs like localStorage or geolocation
- [ ] Study responsive HTML patterns and mobile-first design
- [ ] Review other developers'' HTML code for best practices

### 🌟 **Your Month-Long Web Foundation**
- [ ] Build a portfolio website showcasing your HTML mastery
- [ ] Learn HTML templating with a framework like Handlebars
- [ ] Contribute to open source projects by improving HTML documentation
- [ ] Master advanced HTML concepts like custom elements
- [ ] Integrate HTML with CSS frameworks and JavaScript libraries
- [ ] Mentor others learning HTML fundamentals

## 🎯 Your HTML Mastery Timeline

```mermaid
timeline
    title HTML Learning Progression
    
    section Foundation (5 minutes)
        Document Structure: DOCTYPE declaration
                         : HTML root element
                         : Head vs Body understanding
        
    section Metadata (10 minutes)
        Essential Meta Tags: Character encoding
                           : Viewport configuration
                           : Browser compatibility
        
    section Content Creation (15 minutes)
        Image Integration: Proper file paths
                         : Alt text importance
                         : Self-closing tags
        
    section Layout Organization (20 minutes)
        Container Strategy: Div elements for structure
                          : Class and ID naming
                          : Nested element hierarchy
        
    section Semantic Mastery (30 minutes)
        Meaningful Markup: Heading hierarchy
                         : Screen reader navigation
                         : Accessibility best practices
        
    section Advanced Concepts (1 hour)
        HTML5 Features: Modern semantic elements
                      : ARIA attributes
                      : Performance considerations
        
    section Professional Skills (1 week)
        Code Organization: File structure patterns
                         : Maintainable markup
                         : Team collaboration
        
    section Expert Level (1 month)
        Modern Web Standards: Progressive enhancement
                            : Cross-browser compatibility
                            : HTML specification updates
```

### 🛠️ Your HTML Toolkit Summary

After completing this lesson, you now have:
- **Document Structure**: Complete HTML5 foundation with proper DOCTYPE
- **Semantic Markup**: Meaningful tags that enhance accessibility and SEO
- **Image Integration**: Proper file organization and alt text practices
- **Layout Containers**: Strategic use of divs with descriptive class names
- **Accessibility Awareness**: Understanding of screen reader navigation
- **Modern Standards**: Current HTML5 practices and deprecated tag knowledge
- **Project Foundation**: Solid base for CSS styling and JavaScript interactivity

**Next Steps**: Your HTML structure is ready for CSS styling! The semantic foundation you''ve built will make the next lesson much easier to understand.


## Assignment

Practice your HTML: Build a blog mockup (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/3-terrarium/1-intro-to-html/assignment.md)',17);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'web-development-foundations-5','Terrarium Project Part 2: Introduction to CSS',5,'# Terrarium Project Part 2: Introduction to CSS

```mermaid
journey
    title Your CSS Styling Journey
    section Foundation
      Link CSS file: 3: Student
      Understand cascade: 4: Student
      Learn inheritance: 4: Student
    section Selectors
      Element targeting: 4: Student
      Class patterns: 5: Student
      ID specificity: 5: Student
    section Layout
      Position elements: 4: Student
      Create containers: 5: Student
      Build terrarium: 5: Student
    section Polish
      Add visual effects: 5: Student
      Responsive design: 5: Student
      Glass reflections: 5: Student
```


> Sketchnote by Tomomi Imura (https://twitter.com/girlie_mac)

Remember how your HTML terrarium looked quite basic? CSS is where we transform that plain structure into something visually appealing.

If HTML is like building the frame of a house, then CSS is everything that makes it feel like home - the paint colors, the furniture arrangement, the lighting, and how the rooms flow together. Think of how the Palace of Versailles started as a simple hunting lodge, but careful attention to decoration and layout transformed it into one of the world''s most magnificent buildings.

Today, we''ll transform your terrarium from functional to polished. You''ll learn how to position elements precisely, make layouts respond to different screen sizes, and create the visual appeal that makes websites engaging.

By the end of this lesson, you''ll see how strategic CSS styling can dramatically improve your project. Let''s add some style to your terrarium.

```mermaid
mindmap
  root((CSS Fundamentals))
    Cascade
      Specificity Rules
      Inheritance
      Priority Order
      Conflict Resolution
    Selectors
      Element Tags
      Classes (.class)
      IDs (#id)
      Combinators
    Box Model
      Margin
      Border
      Padding
      Content
    Layout
      Positioning
      Display Types
      Flexbox
      Grid
    Visual Effects
      Colors
      Shadows
      Transitions
      Animations
    Responsive Design
      Media Queries
      Flexible Units
      Viewport Meta
      Mobile First
```

## Pre-Lecture Quiz

Pre-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/17)

## Getting Started with CSS

CSS is often thought of as just "making things pretty," but it serves a much broader purpose. CSS is like being the director of a movie - you control not just how everything looks, but how it moves, responds to interaction, and adapts to different situations.

Modern CSS is remarkably capable. You can write code that automatically adjusts layouts for phones, tablets, and desktop computers. You can create smooth animations that guide users'' attention where needed. The results can be quite impressive when everything works together.

> 💡 **Pro Tip**: CSS is constantly evolving with new features and capabilities. Always check CanIUse.com (https://caniuse.com/) to verify browser support for newer CSS features before using them in production projects.

**Here''s what we''ll accomplish in this lesson:**
- **Creates** a complete visual design for your terrarium using modern CSS techniques
- **Explores** fundamental concepts like the cascade, inheritance, and CSS selectors
- **Implements** responsive positioning and layout strategies
- **Builds** the terrarium container using CSS shapes and styling

### Prerequisite

You should have completed the HTML structure for your terrarium from the previous lesson and have it ready to be styled.

> 📺 **Video Resource**: Check out this helpful video walkthrough
>
> [](https://www.youtube.com/watch?v=6yIdOIV9p1I)

### Setting Up Your CSS File

Before we can start styling, we need to connect CSS to our HTML. This connection tells the browser where to find the styling instructions for our terrarium.

In your terrarium folder, create a new file called `style.css`, then link it in your HTML document''s `` section:

```html

```

**Here''s what this code does:**
- **Creates** a connection between your HTML and CSS files
- **Tells** the browser to load and apply the styles from `style.css`
- **Uses** the `rel="stylesheet"` attribute to specify this is a CSS file
- **References** the file path with `href="./style.css"`

## Understanding the CSS Cascade

Ever wondered why CSS is called "Cascading" Style Sheets? Styles cascade down like a waterfall, and sometimes they conflict with each other.

Consider how military command structures work - a general order might say "all troops wear green," but a specific order to your unit might say "wear dress blues for the ceremony." The more specific instruction takes precedence. CSS follows similar logic, and understanding this hierarchy makes debugging much more manageable.

### Experimenting with Cascade Priority

Let''s see the cascade in action by creating a style conflict. First, add an inline style to your `` tag:

```html
My Terrarium
```

**What this code does:**
- **Applies** a red color directly to the `` element using inline styling
- **Uses** the `style` attribute to embed CSS directly in the HTML
- **Creates** the highest priority style rule for this specific element

Next, add this rule to your `style.css` file:

```css
h1 {
  color: blue;
}
```

**In the above, we''ve:**
- **Defined** a CSS rule that targets all `` elements
- **Set** the text color to blue using an external stylesheet
- **Created** a lower priority rule compared to inline styles

✅ **Knowledge Check**: Which color displays in your web app? Why does that color win? Can you think of scenarios where you might want to override styles?

```mermaid
flowchart TD
    A["Browser encounters h1 element"] --> B{"Check for inline styles"}
    B -->|Found| C["style=''color: red''"] 
    B -->|None| D{"Check for ID rules"}
    C --> E["Apply red color (1000 points)"]
    D -->|Found| F["#heading { color: green }"]
    D -->|None| G{"Check for class rules"}
    F --> H["Apply green color (100 points)"]
    G -->|Found| I[".title { color: blue }"]
    G -->|None| J{"Check element rules"}
    I --> K["Apply blue color (10 points)"]
    J -->|Found| L["h1 { color: purple }"]
    J -->|None| M["Use browser default"]
    L --> N["Apply purple color (1 point)"]
    
    style C fill:#ff6b6b
    style F fill:#51cf66
    style I fill:#339af0
    style L fill:#9775fa
```

> 💡 **CSS Priority Order (highest to lowest):**
> 1. **Inline styles** (style attribute)
> 2. **IDs** (#myId)
> 3. **Classes** (.myClass) and attributes
> 4. **Element selectors** (h1, div, p)
> 5. **Browser defaults**

## CSS Inheritance in Action

CSS inheritance works like genetics - elements inherit certain properties from their parent elements. If you set the font family on the body element, all text inside automatically uses that same font. It''s similar to how the Habsburg family''s distinctive jawline appeared across generations without being specified for each individual.

However, not everything gets inherited. Text styles like fonts and colors do inherit, but layout properties like margins and borders do not. Just as children might inherit physical traits but not their parents'' fashion choices.

### Observing Font Inheritance

Let''s see inheritance in action by setting a font family on the `` element:

```css
body {
  font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;
}
```

**Breaking down what happens here:**
- **Sets** the font family for the entire page by targeting the `` element
- **Uses** a font stack with fallback options for better browser compatibility
- **Applies** modern system fonts that look great across different operating systems
- **Ensures** all child elements inherit this font unless specifically overridden

Open your browser''s developer tools (F12), navigate to the Elements tab, and inspect your `` element. You''ll see that it inherits the font family from the body:



✅ **Experiment Time**: Try setting other inheritable properties on the `` like `color`, `line-height`, or `text-align`. What happens to your heading and other elements?

> 📝 **Inheritable Properties Include**: `color`, `font-family`, `font-size`, `line-height`, `text-align`, `visibility`
>
> **Non-Inheritable Properties Include**: `margin`, `padding`, `border`, `width`, `height`, `position`

### 🔄 **Pedagogical Check-in**
**CSS Foundation Understanding**: Before moving to selectors, ensure you can:
- ✅ Explain the difference between cascade and inheritance
- ✅ Predict which style will win in a specificity conflict
- ✅ Identify which properties inherit from parent elements
- ✅ Connect CSS files to HTML properly

**Quick Test**: If you have these styles, what color will an `` inside a `` be?
```css
div { color: blue; }
.special { color: green; }
h1 { color: red; }
```
*Answer: Red (element selector directly targets h1)*

## Mastering CSS Selectors

CSS selectors are your way of targeting specific elements for styling. They work like giving precise directions - instead of saying "the house," you might say "the blue house with the red door on Maple Street."

CSS provides different ways to be specific, and choosing the right selector is like choosing the appropriate tool for the task. Sometimes you need to style every door in the neighborhood, and sometimes just one specific door.

### Element Selectors (Tags)

Element selectors target HTML elements by their tag name. They''re perfect for setting base styles that apply broadly across your page:

```css
body {
  font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
}

h1 {
  color: #3a241d;
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
```

**Understanding these styles:**
- **Sets** consistent typography across the entire page with the `body` selector
- **Removes** default browser margins and padding for better control
- **Styles** all heading elements with color, alignment, and spacing
- **Uses** `rem` units for scalable, accessible font sizing

While element selectors work well for general styling, you''ll need more specific selectors to style individual components like the plants in your terrarium.

### ID Selectors for Unique Elements

ID selectors use the `#` symbol and target elements with specific `id` attributes. Since IDs must be unique on a page, they''re perfect for styling individual, special elements like our left and right plant containers.

Let''s create the styling for our terrarium''s side containers where the plants will live:

```css
#left-container {
  background-color: #f5f5f5;
  width: 15%;
  left: 0;
  top: 0;
  position: absolute;
  height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
}

#right-container {
  background-color: #f5f5f5;
  width: 15%;
  right: 0;
  top: 0;
  position: absolute;
  height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
}
```

**Here''s what this code accomplishes:**
- **Positions** containers at the far left and right edges using `absolute` positioning
- **Uses** `vh` (viewport height) units for responsive height that adapts to screen size
- **Applies** `box-sizing: border-box` so padding is included in the total width
- **Removes** unnecessary `px` units from zero values for cleaner code
- **Sets** a subtle background color that''s easier on the eyes than stark gray

✅ **Code Quality Challenge**: Notice how this CSS violates the DRY (Don''t Repeat Yourself) principle. Can you refactor it using both an ID and a class?

**Improved approach:**
```html


```

```css
.container {
  background-color: #f5f5f5;
  width: 15%;
  top: 0;
  position: absolute;
  height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
}

#left-container {
  left: 0;
}

#right-container {
  right: 0;
}
```

### Class Selectors for Reusable Styles

Class selectors use the `.` symbol and are perfect when you want to apply the same styles to multiple elements. Unlike IDs, classes can be reused throughout your HTML, making them ideal for consistent styling patterns.

In our terrarium, each plant needs similar styling but also needs individual positioning. We''ll use a combination of classes for shared styles and IDs for unique positioning.

**Here''s the HTML structure for each plant:**
```html

  

```

**Key elements explained:**
- **Uses** `class="plant-holder"` for consistent container styling across all plants
- **Applies** `class="plant"` for shared image styling and behavior
- **Includes** unique `id="plant1"` for individual positioning and JavaScript interaction
- **Provides** descriptive alt text for screen reader accessibility

Now add these styles to your `style.css` file:

```css
.plant-holder {
  position: relative;
  height: 13%;
  left: -0.6rem;
}

.plant {
  position: absolute;
  max-width: 150%;
  max-height: 150%;
  z-index: 2;
  transition: transform 0.3s ease;
}

.plant:hover {
  transform: scale(1.05);
}
```

**Breaking down these styles:**
- **Creates** relative positioning for the plant holder to establish a positioning context
- **Sets** each plant holder to 13% height, ensuring all plants fit vertically without scrolling
- **Shifts** holders slightly left to better center plants within their containers
- **Allows** plants to scale responsively with `max-width` and `max-height` properties
- **Uses** `z-index` to layer plants above other elements in the terrarium
- **Adds** a subtle hover effect with CSS transitions for better user interaction

✅ **Critical Thinking**: Why do we need both `.plant-holder` and `.plant` selectors? What would happen if we tried to use just one?

> 💡 **Design Pattern**: The container (`.plant-holder`) controls layout and positioning, while the content (`.plant`) controls appearance and scaling. This separation makes the code more maintainable and flexible.

## Understanding CSS Positioning

CSS positioning is like being the stage director for a play - you direct where every actor stands and how they move around the stage. Some actors follow the standard formation, while others need specific positioning for dramatic effect.

Once you understand positioning, many layout challenges become manageable. Need a navigation bar that stays at the top while users scroll? Positioning handles that. Want a tooltip that appears at a specific location? That''s positioning too.

### The Five Position Values

```mermaid
quadrantChart
    title CSS Positioning Strategy
    x-axis Document Flow --> Removed from Flow
    y-axis Static Position --> Precise Control
    quadrant-1 Absolute
    quadrant-2 Fixed
    quadrant-3 Static
    quadrant-4 Sticky
    
    Static: [0.2, 0.2]
    Relative: [0.3, 0.6]
    Absolute: [0.8, 0.8]
    Fixed: [0.9, 0.7]
    Sticky: [0.5, 0.9]
```

| Position Value | Behavior | Use Case |
|----------------|----------|----------|
| `static` | Default flow, ignores top/left/right/bottom | Normal document layout |
| `relative` | Positioned relative to its normal position | Small adjustments, creating positioning context |
| `absolute` | Positioned relative to nearest positioned ancestor | Precise placement, overlays |
| `fixed` | Positioned relative to viewport | Navigation bars, floating elements |
| `sticky` | Switches between relative and fixed based on scroll | Headers that stick when scrolling |

### Positioning in Our Terrarium

Our terrarium uses a strategic combination of positioning types to create the desired layout:

```css
/* Container positioning */
.container {
  position: absolute; /* Removes from normal flow */
  /* ... other styles ... */
}

/* Plant holder positioning */
.plant-holder {
  position: relative; /* Creates positioning context */
  /* ... other styles ... */
}

/* Plant positioning */
.plant {
  position: absolute; /* Allows precise placement within holder */
  /* ... other styles ... */
}
```

**Understanding the positioning strategy:**
- **Absolute containers** are removed from normal document flow and pinned to screen edges
- **Relative plant holders** create a positioning context while staying in document flow
- **Absolute plants** can be positioned precisely within their relative containers
- **This combination** allows plants to stack vertically while being individually positionable

> 🎯 **Why This Matters**: The `plant` elements need absolute positioning to become draggable in the next lesson. Absolute positioning removes them from the normal layout flow, making drag-and-drop interactions possible.

✅ **Experiment Time**: Try changing the positioning values and observe the results:
- What happens if you change `.container` from `absolute` to `relative`?
- How does the layout change if `.plant-holder` uses `absolute` instead of `relative`?
- What occurs when you switch `.plant` to `relative` positioning?

### 🔄 **Pedagogical Check-in**
**CSS Positioning Mastery**: Pause to verify your understanding:
- ✅ Can you explain why plants need absolute positioning for drag-and-drop?
- ✅ Do you understand how relative containers create positioning context?
- ✅ Why do the side containers use absolute positioning?
- ✅ What would happen if you removed position declarations entirely?

**Real-World Connection**: Think about how CSS positioning mirrors real-world layout:
- **Static**: Books on a shelf (natural order)
- **Relative**: Moving a book slightly but keeping its spot
- **Absolute**: Placing a bookmark at an exact page number
- **Fixed**: A sticky note that stays visible as you flip pages

## Building the Terrarium with CSS

Now we''ll build a glass jar using only CSS - no images or graphics software required.

Creating realistic-looking glass, shadows, and depth effects using positioning and transparency demonstrates CSS''s visual capabilities. This technique mirrors how architects in the Bauhaus movement used simple geometric forms to create complex, beautiful structures. Once you understand these principles, you''ll recognize the CSS techniques behind many web designs.

```mermaid
flowchart LR
    A[Jar Top] --> E[Complete Terrarium]
    B[Jar Walls] --> E
    C[Dirt Layer] --> E
    D[Jar Bottom] --> E
    F[Glass Effects] --> E
    
    A1["50% width5% heightTop position"] --> A
    B1["60% width80% heightRounded corners0.5 opacity"] --> B
    C1["60% width5% heightDark brownBottom layer"] --> C
    D1["50% width1% heightBottom position"] --> D
    F1["Subtle shadowsTransparencyZ-index layering"] --> F
    
    style E fill:#d1e1df,stroke:#3a241d
    style A fill:#e8f5e8
    style B fill:#e8f5e8
    style C fill:#8B4513
    style D fill:#e8f5e8
```

### Creating the Glass Jar Components

Let''s build the terrarium jar piece by piece. Each part uses absolute positioning and percentage-based sizing for responsive design:

```css
.jar-walls {
  height: 80%;
  width: 60%;
  background: #d1e1df;
  border-radius: 1rem;
  position: absolute;
  bottom: 0.5%;
  left: 20%;
  opacity: 0.5;
  z-index: 1;
  box-shadow: inset 0 0 2rem rgba(0, 0, 0, 0.1);
}

.jar-top {
  width: 50%;
  height: 5%;
  background: #d1e1df;
  position: absolute;
  bottom: 80.5%;
  left: 25%;
  opacity: 0.7;
  z-index: 1;
  border-radius: 0.5rem 0.5rem 0 0;
}

.jar-bottom {
  width: 50%;
  height: 1%;
  background: #d1e1df;
  position: absolute;
  bottom: 0;
  left: 25%;
  opacity: 0.7;
  border-radius: 0 0 0.5rem 0.5rem;
}

.dirt {
  width: 60%;
  height: 5%;
  background: #3a241d;
  position: absolute;
  border-radius: 0 0 1rem 1rem;
  bottom: 1%;
  left: 20%;
  opacity: 0.7;
  z-index: -1;
}
```

**Understanding the terrarium construction:**
- **Uses** percentage-based dimensions for responsive scaling across all screen sizes
- **Positions** elements absolutely to stack and align them precisely
- **Applies** different opacity values to create the glass transparency effect
- **Implements** `z-index` layering so plants appear inside the jar
- **Adds** subtle box-shadow and refined border-radius for more realistic appearance

### Responsive Design with Percentages

Notice how all dimensions use percentages rather than fixed pixel values:

**Why this matters:**
- **Ensures** the terrarium scales proportionally on any screen size
- **Maintains** the visual relationships between jar components
- **Provides** a consistent experience from mobile phones to large desktop monitors
- **Allows** the design to adapt without breaking the visual layout

### CSS Units in Action

We''re using `rem` units for border-radius, which scale relative to the root font size. This creates more accessible designs that respect user font preferences. Learn more about CSS relative units (https://www.w3.org/TR/css-values-3/#font-relative-lengths) in the official specification.

✅ **Visual Experimentation**: Try modifying these values and observe the effects:
- Change the jar opacity from 0.5 to 0.8 – how does this affect the glass appearance?
- Adjust the dirt color from `#3a241d` to `#8B4513` – what visual impact does this have?
- Modify the `z-index` of the dirt to 2 – what happens to the layering?

### 🔄 **Pedagogical Check-in**
**CSS Visual Design Understanding**: Confirm your grasp of visual CSS:
- ✅ How do percentage-based dimensions create responsive design?
- ✅ Why does opacity create the glass transparency effect?
- ✅ What role does z-index play in layering elements?
- ✅ How do border-radius values create the jar shape?

**Design Principle**: Notice how we''re building complex visuals from simple shapes:
1. **Rectangles** → **Rounded rectangles** → **Jar components**
2. **Flat colors** → **Opacity** → **Glass effect**
3. **Individual elements** → **Layered composition** → **3D appearance**

---

## GitHub Copilot Agent Challenge 🚀

Use the Agent mode to complete the following challenge:

**Description:** Create a CSS animation that makes the terrarium plants gently sway back and forth, simulating a natural breeze effect. This will help you practice CSS animations, transforms, and keyframes while enhancing the visual appeal of your terrarium.

**Prompt:** Add CSS keyframe animations to make the plants in the terrarium sway gently from side to side. Create a swaying animation that rotates each plant slightly (2-3 degrees) left and right with a duration of 3-4 seconds, and apply it to the `.plant` class. Make sure the animation loops infinitely and has an easing function for natural movement.

Learn more about agent mode (https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode) here.

## 🚀 Challenge: Adding Glass Reflections

Ready to enhance your terrarium with realistic glass reflections? This technique will add depth and realism to the design.

You''ll create subtle highlights that simulate how light reflects off glass surfaces. This approach is similar to how Renaissance painters like Jan van Eyck used light and reflection to make painted glass appear three-dimensional. Here''s what you''re aiming for:



**Your challenge:**
- **Create** subtle white or light-colored oval shapes for the glass reflections
- **Position** them strategically on the left side of the jar
- **Apply** appropriate opacity and blur effects for realistic light reflection
- **Use** `border-radius` to create organic, bubble-like shapes
- **Experiment** with gradients or box-shadows for enhanced realism

## Post-Lecture Quiz

Post-lecture quiz (https://ff-quizzes.netlify.app/web/quiz/18)

## Expand Your CSS Knowledge

CSS can feel complex initially, but understanding these core concepts provides a solid foundation for more advanced techniques.

**Your next CSS learning areas:**
- **Flexbox** - simplifies alignment and distribution of elements
- **CSS Grid** - provides powerful tools for creating complex layouts
- **CSS Variables** - reduces repetition and improves maintainability
- **Responsive design** - ensures sites work well across different screen sizes

### Interactive Learning Resources

Practice these concepts with these engaging, hands-on games:
- 🐸 Flexbox Froggy (https://flexboxfroggy.com/) - Master Flexbox through fun challenges
- 🌱 Grid Garden (https://codepip.com/games/grid-garden/) - Learn CSS Grid by growing virtual carrots
- 🎯 CSS Battle (https://cssbattle.dev/) - Test your CSS skills with coding challenges

### Additional Learning

For comprehensive CSS fundamentals, complete this Microsoft Learn module: Style your HTML app with CSS (https://docs.microsoft.com/learn/modules/build-simple-website/4-css-basics/?WT.mc_id=academic-77807-sagibbon)

### ⚡ **What You Can Do in the Next 5 Minutes**
- [ ] Open DevTools and inspect CSS styles on any website using the Elements panel
- [ ] Create a simple CSS file and link it to an HTML page
- [ ] Try changing colors using different methods: hex, RGB, and named colors
- [ ] Practice the box model by adding padding and margin to a div

### 🎯 **What You Can Accomplish This Hour**
- [ ] Complete the post-lesson quiz and review CSS fundamentals
- [ ] Style your HTML page with fonts, colors, and spacing
- [ ] Create a simple layout using flexbox or grid
- [ ] Experiment with CSS transitions for smooth effects
- [ ] Practice responsive design with media queries

### 📅 **Your Week-Long CSS Adventure**
- [ ] Complete the terrarium styling assignment with creative flair
- [ ] Master CSS Grid by building a photo gallery layout
- [ ] Learn CSS animations to bring your designs to life
- [ ] Explore CSS preprocessors like Sass or Less
- [ ] Study design principles and apply them to your CSS
- [ ] Analyze and recreate interesting designs you find online

### 🌟 **Your Month-Long Design Mastery**
- [ ] Build a complete responsive website design system
- [ ] Learn CSS-in-JS or utility-first frameworks like Tailwind
- [ ] Contribute to open source projects with CSS improvements
- [ ] Master advanced CSS concepts like CSS custom properties and containment
- [ ] Create reusable component libraries with modular CSS
- [ ] Mentor others learning CSS and share design knowledge

## 🎯 Your CSS Mastery Timeline

```mermaid
timeline
    title CSS Learning Progression
    
    section Foundation (10 minutes)
        File Connection: Link CSS to HTML
                       : Understand cascade rules
                       : Learn inheritance basics
        
    section Selectors (15 minutes)
        Targeting Elements: Element selectors
                          : Class patterns
                          : ID specificity
                          : Combinators
        
    section Box Model (20 minutes)
        Layout Fundamentals: Margin and padding
                           : Border properties
                           : Content sizing
                           : Box-sizing behavior
        
    section Positioning (25 minutes)
        Element Placement: Static vs relative
                         : Absolute positioning
                         : Z-index layering
                         : Responsive units
        
    section Visual Design (30 minutes)
        Styling Mastery: Colors and opacity
                       : Shadows and effects
                       : Transitions
                       : Transform properties
        
    section Responsive Design (45 minutes)
        Multi-Device Support: Media queries
                            : Flexible layouts
                            : Mobile-first approach
                            : Viewport optimization
        
    section Advanced Techniques (1 week)
        Modern CSS: Flexbox layouts
                  : CSS Grid systems
                  : Custom properties
                  : Animation keyframes
        
    section Professional Skills (1 month)
        CSS Architecture: Component patterns
                        : Maintainable code
                        : Performance optimization
                        : Cross-browser compatibility
```

### 🛠️ Your CSS Toolkit Summary

After completing this lesson, you now have:
- **Cascade Understanding**: How styles inherit and override each other
- **Selector Mastery**: Precise targeting with elements, classes, and IDs
- **Positioning Skills**: Strategic element placement and layering
- **Visual Design**: Creating glass effects, shadows, and transparency
- **Responsive Techniques**: Percentage-based layouts that adapt to any screen
- **Code Organization**: Clean, maintainable CSS structure
- **Modern Practices**: Using relative units and accessible design patterns

**Next Steps**: Your terrarium now has both structure (HTML) and style (CSS). The final lesson will add interactivity with JavaScript!

## Assignment

CSS Refactoring (https://raw.githubusercontent.com/microsoft/Web-Dev-For-Beginners/78085398be0dea7abaaf5eda914817f46f6ddbbc/3-terrarium/2-intro-to-css/assignment.md)',21);
update public.books set status='APPROVED',published_at=now() where id=b;end if;
if not exists(select 1 from public.books where slug='machine-learning-foundations') then
insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values('machine-learning-foundations','Machine Learning Foundations','Microsoft and curriculum contributors','A chapter-based reading guide adapted from the openly licensed ML-For-Beginners curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.','Artificial Intelligence','English','https://github.com/microsoft/ML-For-Beginners/tree/de2d4e12236445198213a0711855e348e7253cd4','MIT','https://github.com/microsoft/ML-For-Beginners/blob/de2d4e12236445198213a0711855e348e7253cd4/LICENSE','    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
','Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained. This is a reading adaptation, not a complete standalone edition.','https://github.com/microsoft/ML-For-Beginners/blob/de2d4e12236445198213a0711855e348e7253cd4/LICENSE','Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.',true,true,36) returning id into b;
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'machine-learning-foundations-1','Introduction to machine learning',1,'# Introduction to machine learning

## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)

---

[](https://youtu.be/6mSx_KJxcHI "ML for beginners - Introduction to Machine Learning for Beginners")

> 🎥 Click the image above for a short video working through this lesson.

Welcome to this course on classical machine learning for beginners! Whether you''re completely new to this topic, or an experienced ML practitioner looking to brush up on an area, we''re happy to have you join us! We want to create a friendly launching spot for your ML study and would be happy to evaluate, respond to, and incorporate your feedback (https://github.com/microsoft/ML-For-Beginners/discussions).

[](https://youtu.be/h0e2HAPTGF4 "Introduction to ML")

> 🎥 Click the image above for a video: MIT''s John Guttag introduces machine learning

---
## Getting started with machine learning

Before starting with this curriculum, you need to have your computer set up and ready to run notebooks locally.

- **Configure your machine with these videos**. Use the following links to learn how to install Python (https://youtu.be/CXZYvNRIAKM) in your system and setup a text editor (https://youtu.be/EU8eayHWoZg) for development.
- **Learn Python**. It''s also recommended to have a basic understanding of Python (https://docs.microsoft.com/learn/paths/python-language/?WT.mc_id=academic-77952-leestott), a programming language useful for data scientists that we use in this course.
- **Learn Node.js and JavaScript**. We also use JavaScript a few times in this course when building web apps, so you will need to have node (https://nodejs.org/) and npm (https://www.npmjs.com/) installed, as well as Visual Studio Code (https://code.visualstudio.com/) available for both Python and JavaScript development.
- **Create a GitHub account**. Since you found us here on GitHub (https://github.com/), you might already have an account, but if not, create one and then fork this curriculum to use on your own. (Feel free to give us a star, too 😊)
- **Explore Scikit-learn**. Familiarize yourself with Scikit-learn (https://scikit-learn.org/stable/user_guide.html), a set of ML libraries that we reference in these lessons.

---
## What is machine learning?

The term ''machine learning'' is one of the most popular and frequently used terms of today. There is a nontrivial possibility that you have heard this term at least once if you have some sort of familiarity with technology, no matter what domain you work in. The mechanics of machine learning, however, are a mystery to most people. For a machine learning beginner, the subject can sometimes feel overwhelming. Therefore, it is important to understand what machine learning actually is, and to learn about it step by step, through practical examples.

---
## The hype curve



> Google Trends shows the recent ''hype curve'' of the term ''machine learning''

---
## A mysterious universe

We live in a universe full of fascinating mysteries. Great scientists such as Stephen Hawking, Albert Einstein, and many more have devoted their lives to searching for meaningful information that uncovers the mysteries of the world around us. This is the human condition of learning: a human child learns new things and uncovers the structure of their world year by year as they grow to adulthood.

---
## The child''s brain

A child''s brain and senses perceive the facts of their surroundings and gradually learn the hidden patterns of life which help the child to craft logical rules to identify learned patterns. The learning process of the human brain makes humans the most sophisticated living creature of this world. Learning continuously by discovering hidden patterns and then innovating on those patterns enables us to make ourselves better and better throughout our lifetime. This learning capacity and evolving capability is related to a concept called brain plasticity (https://www.simplypsychology.org/brain-plasticity.html). Superficially, we can draw some motivational similarities between the learning process of the human brain and the concepts of machine learning.

---
## The human brain

The human brain (https://www.livescience.com/29365-human-brain.html) perceives things from the real world, processes the perceived information, makes rational decisions, and performs certain actions based on circumstances. This is what we called behaving intelligently. When we program a facsimile of the intelligent behavioral process to a machine, it is called artificial intelligence (AI).

---
## Some terminology

Although the terms can be confused, machine learning (ML) is an important subset of artificial intelligence. **ML is concerned with using specialized algorithms to uncover meaningful information and find hidden patterns from perceived data to corroborate the rational decision-making process**.

---
## AI, ML, Deep Learning



> A diagram showing the relationships between AI, ML, deep learning, and data science. Infographic by Jen Looper (https://twitter.com/jenlooper) inspired by this graphic (https://softwareengineering.stackexchange.com/questions/366996/distinction-between-ai-ml-neural-networks-deep-learning-and-data-mining)

---
## Concepts to cover

In this curriculum, we are going to cover only the core concepts of machine learning that a beginner must know. We cover what we call ''classical machine learning'' primarily using Scikit-learn, an excellent library many students use to learn the basics.  To understand broader concepts of artificial intelligence or deep learning, a strong fundamental knowledge of machine learning is indispensable, and so we would like to offer it here.

---
## In this course you will learn:

- core concepts of machine learning
- the history of ML
- ML and fairness
- regression ML techniques
- classification ML techniques
- clustering ML techniques
- natural language processing ML techniques
- time series forecasting ML techniques
- reinforcement learning
- real-world applications for ML

---
## What we will not cover

- deep learning
- neural networks
- AI

To make for a better learning experience, we will avoid the complexities of neural networks, ''deep learning'' - many-layered model-building using neural networks - and AI, which we will discuss in a different curriculum. We also will offer a forthcoming data science curriculum to focus on that aspect of this larger field.

---
## Why study machine learning?

Machine learning, from a systems perspective, is defined as the creation of automated systems that can learn hidden patterns from data to aid in making intelligent decisions.

This motivation is loosely inspired by how the human brain learns certain things based on the data it perceives from the outside world.

✅ Think for a minute why a business would want to try to use machine learning strategies vs. creating a hard-coded rules-based engine.

---
## Why data quality matters

High-quality data improves model performance. Poor or noisy data can lead to inaccurate predictions, even when using advanced machine learning algorithms.

---
## Applications of machine learning

Applications of machine learning are now almost everywhere, and are as ubiquitous as the data that is flowing around our societies, generated by our smart phones, connected devices, and other systems. Considering the immense potential of state-of-the-art machine learning algorithms, researchers have been exploring their capability to solve multi-dimensional and multi-disciplinary real-life problems with great positive outcomes.

---
## Examples of applied ML

**You can use machine learning in many ways**:

- To predict the likelihood of disease from a patient''s medical history or reports.
- To leverage weather data to predict weather events.
- To understand the sentiment of a text.
- To detect fake news to stop the spread of propaganda.

Finance, economics, earth science, space exploration, biomedical engineering, cognitive science, and even fields in the humanities have adapted machine learning to solve the arduous, data-processing heavy problems of their domain.

---
## Conclusion

Machine learning automates the process of pattern-discovery by finding meaningful insights from real-world or generated data. It has proven itself to be highly valuable in business, health, and financial applications, among others.

In the near future, understanding the basics of machine learning is going to be a must for people from any domain due to its widespread adoption.

---
# 🚀 Challenge

Sketch, on paper or using an online app like Excalidraw (https://excalidraw.com/), your understanding of the differences between AI, ML, deep learning, and data science. Add some ideas of problems that each of these techniques are good at solving.

# Post-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)

---
# Review & Self Study

To learn more about how you can work with ML algorithms in the cloud, follow this Learning Path (https://docs.microsoft.com/learn/paths/create-no-code-predictive-models-azure-machine-learning/?WT.mc_id=academic-77952-leestott).

Take a Learning Path (https://docs.microsoft.com/learn/modules/introduction-to-machine-learning/?WT.mc_id=academic-77952-leestott) about the basics of ML.

---
# Assignment

Get up and running (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/1-Introduction/1-intro-to-ML/assignment.md)',7);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'machine-learning-foundations-2','History of machine learning',2,'# History of machine learning


> Sketchnote by Tomomi Imura (https://www.twitter.com/girlie_mac)

## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)

---

[](https://youtu.be/N6wxM4wZ7V0 "ML for beginners - History of Machine Learning")

> 🎥 Click the image above for a short video working through this lesson.

In this lesson, we will walk through the major milestones in the history of machine learning and artificial intelligence.

The history of artificial intelligence (AI) as a field is intertwined with the history of machine learning, as the algorithms and computational advances that underpin ML fed into the development of AI. It is useful to remember that, while these fields as distinct areas of inquiry began to crystallize in the 1950s, important algorithmic, statistical, mathematical, computational and technical discoveries (https://wikipedia.org/wiki/Timeline_of_machine_learning) predated and overlapped this era. In fact, people have been thinking about these questions for hundreds of years (https://wikipedia.org/wiki/History_of_artificial_intelligence): this article discusses the historical intellectual underpinnings of the idea of a ''thinking machine.''

---
## Notable discoveries

- 1763, 1812 Bayes Theorem (https://wikipedia.org/wiki/Bayes%27_theorem) and its predecessors. This theorem and its applications underlie inference, describing the probability of an event occurring based on prior knowledge.
- 1805 Least Square Theory (https://wikipedia.org/wiki/Least_squares) by French mathematician Adrien-Marie Legendre. This theory, which you will learn about in our Regression unit, helps in data fitting.
- 1913 Markov Chains (https://wikipedia.org/wiki/Markov_chain), named after Russian mathematician Andrey Markov, is used to describe a sequence of possible events based on a previous state.
- 1957 Perceptron (https://wikipedia.org/wiki/Perceptron) is a type of linear classifier invented by American psychologist Frank Rosenblatt that underlies advances in deep learning.

---

- 1967 Nearest Neighbor (https://wikipedia.org/wiki/Nearest_neighbor) is an algorithm originally designed to map routes. In an ML context it is used to detect patterns.
- 1970 Backpropagation (https://wikipedia.org/wiki/Backpropagation) is used to train feedforward neural networks (https://wikipedia.org/wiki/Feedforward_neural_network).
- 1982 Recurrent Neural Networks (https://wikipedia.org/wiki/Recurrent_neural_network) are artificial neural networks derived from feedforward neural networks that create temporal graphs.

✅ Do a little research. What other dates stand out as pivotal in the history of ML and AI?

---
## 1950: Machines that think

Alan Turing, a truly remarkable person who was voted by the public in 2019 (https://wikipedia.org/wiki/Icons:_The_Greatest_Person_of_the_20th_Century) as the greatest scientist of the 20th century, is credited as helping to lay the foundation for the concept of a ''machine that can think.'' He grappled with naysayers and his own need for empirical evidence of this concept in part by creating the Turing Test (https://www.bbc.com/news/technology-18475646), which you will explore in our NLP lessons.

---
## 1956: Dartmouth Summer Research Project

"The Dartmouth Summer Research Project on artificial intelligence was a seminal event for artificial intelligence as a field," and it was here that the term ''artificial intelligence'' was coined (source (https://250.dartmouth.edu/highlights/artificial-intelligence-ai-coined-dartmouth)).

> Every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it.

---

The lead researcher, mathematics professor John McCarthy, hoped "to proceed on the basis of the conjecture that every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it." The participants included another luminary in the field, Marvin Minsky.

The workshop is credited with having initiated and encouraged several discussions including "the rise of symbolic methods, systems focussed on limited domains (early expert systems), and deductive systems versus inductive systems." (source (https://wikipedia.org/wiki/Dartmouth_workshop)).

---
## 1956 - 1974: "The golden years"

From the 1950s through the mid ''70s, optimism ran high in the hope that AI could solve many problems. In 1967, Marvin Minsky stated confidently that "Within a generation ... the problem of creating ''artificial intelligence'' will substantially be solved." (Minsky, Marvin (1967), Computation: Finite and Infinite Machines, Englewood Cliffs, N.J.: Prentice-Hall)

Natural language processing research flourished, search was refined and made more powerful, and the concept of ''micro-worlds'' was created, where simple tasks were completed using plain language instructions.

---

Research was well funded by government agencies, advances were made in computation and algorithms, and prototypes of intelligent machines were built. Some of these machines include:

* Shakey the robot (https://wikipedia.org/wiki/Shakey_the_robot), who could maneuver and decide how to perform tasks ''intelligently''.

    
    > Shakey in 1972

---

* Eliza, an early ''chatterbot'', could converse with people and act as a primitive ''therapist''. You''ll learn more about Eliza in the NLP lessons.

    
    > A version of Eliza, a chatbot

---

* "Blocks world" was an example of a micro-world where blocks could be stacked and sorted, and experiments in teaching machines to make decisions could be tested. Advances built with libraries such as SHRDLU (https://wikipedia.org/wiki/SHRDLU) helped propel language processing forward.

    [](https://www.youtube.com/watch?v=QAJz4YKUwqw "blocks world with SHRDLU")

    > 🎥 Click the image above for a video: Blocks world with SHRDLU

---
## 1974 - 1980: "AI Winter"

By the mid 1970s, it had become apparent that the complexity of making ''intelligent machines'' had been understated and that its promise, given the available compute power, had been overblown. Funding dried up and confidence in the field slowed. Some issues that impacted confidence included:
---
- **Limitations**. Compute power was too limited.
- **Combinatorial explosion**. The amount of parameters needed to be trained grew exponentially as more was asked of computers, without a parallel evolution of compute power and capability.
- **Paucity of data**. There was a paucity of data that hindered the process of testing, developing, and refining algorithms.
- **Are we asking the right questions?**. The very questions that were being asked began to be questioned. Researchers began to field criticism about their approaches:
  - Turing tests came into question by means, among other ideas, of the ''chinese room theory'' which posited that, "programming a digital computer may make it appear to understand language but could not produce real understanding." (source (https://plato.stanford.edu/entries/chinese-room/))
  - The ethics of introducing artificial intelligences such as the "therapist" ELIZA into society was challenged.

---

At the same time, various AI schools of thought began to form. A dichotomy was established between "scruffy" vs. "neat AI" (https://wikipedia.org/wiki/Neats_and_scruffies) practices. _Scruffy_ labs tweaked programs for hours until they had the desired results. _Neat_ labs "focused on logic and formal problem solving". ELIZA and SHRDLU were well-known _scruffy_ systems. In the 1980s, as demand emerged to make ML systems reproducible, the _neat_ approach gradually took the forefront as its results are more explainable.

---
## 1980s Expert systems

As the field grew, its benefit to business became clearer, and in the 1980s so did the proliferation of ''expert systems''. "Expert systems were among the first truly successful forms of artificial intelligence (AI) software." (source (https://wikipedia.org/wiki/Expert_system)).

This type of system is actually _hybrid_, consisting partially of a rules engine defining business requirements, and an inference engine that leveraged the rules system to deduce new facts.

This era also saw increasing attention paid to neural networks.

---
## 1987 - 1993: AI ''Chill''

The proliferation of specialized expert systems hardware had the unfortunate effect of becoming too specialized. The rise of personal computers also competed with these large, specialized, centralized systems. The democratization of computing had begun, and it eventually paved the way for the modern explosion of big data.

---
## 1993 - 2011

This epoch saw a new era for ML and AI to be able to solve some of the problems that had been caused earlier by the lack of data and compute power. The amount of data began to rapidly increase and become more widely available, for better and for worse, especially with the advent of the smartphone around 2007. Compute power expanded exponentially, and algorithms evolved alongside. The field began to gain maturity as the freewheeling days of the past began to crystallize into a true discipline.

---
## Now

Today machine learning and AI touch almost every part of our lives. This era calls for careful understanding of the risks and potentials effects of these algorithms on human lives. As Microsoft''s Brad Smith has stated, "Information technology raises issues that go to the heart of fundamental human-rights protections like privacy and freedom of expression. These issues heighten responsibility for tech companies that create these products. In our view, they also call for thoughtful government regulation and for the development of norms around acceptable uses" (source (https://www.technologyreview.com/2019/12/18/102365/the-future-of-ais-impact-on-society/)).

---

It remains to be seen what the future holds, but it is important to understand these computer systems and the software and algorithms that they run. We hope that this curriculum will help you to gain a better understanding so that you can decide for yourself.

[](https://www.youtube.com/watch?v=mTtDfKgLm54 "The history of deep learning")
> 🎥 Click the image above for a video: Yann LeCun discusses the history of deep learning in this lecture

---
## 🚀Challenge

Dig into one of these historical moments and learn more about the people behind them. There are fascinating characters, and no scientific discovery was ever created in a cultural vacuum. What do you discover?

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)

---
## Review & Self Study

Here are items to watch and listen to:

This podcast where Amy Boyd discusses the evolution of AI (http://runasradio.com/Shows/Show/739)

[](https://www.youtube.com/watch?v=EJt3_bFYKss "The history of AI by Amy Boyd")

---

## Assignment

Create a timeline (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/1-Introduction/2-history-of-ML/assignment.md)',8);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'machine-learning-foundations-3','Building Machine Learning solutions with responsible AI',3,'# Building Machine Learning solutions with responsible AI
 

> Sketchnote by Tomomi Imura (https://www.twitter.com/girlie_mac)

## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)
 
## Introduction

In this curriculum, you will start to discover how machine learning can and is impacting our everyday lives. Even now, systems and models are involved in daily decision-making tasks, such as health care diagnoses, loan approvals or detecting fraud. So, it is important that these models work well to provide outcomes that are trustworthy. Just as any software application, AI systems are going to miss expectations or have an undesirable outcome. That is why it is essential to be able to understand and explain the behavior of an AI model. 

Imagine what can happen when the data you are using to build these models lacks certain demographics, such as race, gender, political view, religion, or disproportionally represents such demographics. What about when the model’s output is interpreted to favor some demographic? What is the consequence for the application? In addition, what happens when the model has an adverse outcome and is harmful to people? Who is accountable for the AI systems behavior? These are some questions we will explore in this curriculum. 

In this lesson, you will: 

- Raise your awareness of the importance of fairness in machine learning and fairness-related harms.
- Become familiar with the practice of exploring outliers and unusual scenarios to ensure reliability and safety
- Gain understanding on the need to empower everyone by designing inclusive systems
- Explore how vital it is to protect privacy and security of data and people
- See the importance of having a glass box approach to explain the behavior of AI models
- Be mindful of how accountability is essential to build trust in AI systems

## Prerequisite

As a prerequisite, please take the "Responsible AI Principles" Learn Path and watch the video below on the topic:

Learn more about Responsible AI by following this Learning Path (https://docs.microsoft.com/learn/modules/responsible-ai-principles/?WT.mc_id=academic-77952-leestott)

[](https://youtu.be/dnC8-uUZXSc "Microsoft''s Approach to Responsible AI")

> 🎥 Click the image above for a video: Microsoft''s Approach to Responsible AI

## Fairness

AI systems should treat everyone fairly and avoid affecting similar groups of people in different ways. For example, when AI systems provide guidance on medical treatment, loan applications, or employment, they should make the same recommendations to everyone with similar symptoms, financial circumstances, or professional qualifications. Each of us as humans carries around inherited biases that affect our decisions and actions. These biases can be evident in the data that we use to train AI systems. Such manipulation can sometimes happen unintentionally. It is often difficult to consciously know when you are introducing bias in data. 

**“Unfairness”** encompasses negative impacts, or “harms”, for a group of people, such as those defined in terms of race, gender, age, or disability status. The main fairness-related harms can be classified as: 

- **Allocation**, if a gender or ethnicity for example is favored over another.
- **Quality of service**. If you train the data for one specific scenario but reality is much more complex, it leads to a poor performing service.  For instance, a hand soap dispenser that could not seem to be able to sense people with dark skin. Reference (https://gizmodo.com/why-cant-this-soap-dispenser-identify-dark-skin-1797931773)
- **Denigration**. To unfairly criticize and label something or someone. For example, an image labeling technology infamously mislabeled images of dark-skinned people as gorillas.
- **Over- or under- representation**. The idea is that a certain group is not seen in a certain profession, and any service or function that keeps promoting that is contributing to harm.
- **Stereotyping**. Associating a given group with pre-assigned attributes.  For example, a language translation system between English and Turkish may have inaccuracies due to words with stereotypical associations to gender.


> translation to Turkish


> translation back to English

When designing and testing AI systems, we need to ensure that AI is fair and not programmed to make biased or discriminatory decisions, which human beings are also prohibited from making. Guaranteeing fairness in AI and machine learning remains a complex sociotechnical challenge. 

### Reliability and safety

To build trust, AI systems need to be reliable, safe, and consistent under normal and unexpected conditions. It is important to know how AI systems will behavior in a variety of situations, especially when they are outliers. When building AI solutions, there needs to be a substantial amount of focus on how to handle a wide variety of circumstances that the AI solutions would encounter. For example, a self-driving car needs to put people''s safety as a top priority. As a result, the AI powering the car need to consider all the possible scenarios that the car could come across such as night, thunderstorms or blizzards, kids running across the street, pets, road constructions etc. How well an AI system can handle a wild range of conditions reliably and safely reflects the level of anticipation the data scientist or AI developer considered during the design or testing of the system.  

> 🎥 Click here for a video: Reliability and safety in AI (https://www.microsoft.com/videoplayer/embed/RE4vvIl)

### Inclusiveness

AI systems should be designed to engage and empower everyone. When designing and implementing AI systems data scientists and AI developers identify and address potential barriers in the system that could unintentionally exclude people. For example, there are 1 billion people with disabilities around the world. With the advancement of AI, they can access a wide range of information and opportunities more easily in their daily lives. By addressing the barriers, it creates opportunities to innovate and develop AI products with better experiences that benefit everyone. 

> 🎥 Click here for a video: Inclusiveness in AI (https://www.microsoft.com/videoplayer/embed/RE4vl9v)

### Security and privacy 

AI systems should be safe and respect people’s privacy. People have less trust in systems that put their privacy, information, or lives at risk. When training machine learning models, we rely on data to produce the best results. In doing so, the origin of the data and integrity must be considered. For example, was the data user submitted or publicly available? Next, while working with the data, it is crucial to develop AI systems that can protect confidential information and resist attacks. As AI becomes more prevalent, protecting privacy and securing important personal and business information is becoming more critical and complex. Privacy and data security issues require especially close attention for AI because access to data is essential for AI systems to make accurate and informed predictions and decisions about people. 

> 🎥 Click here for a video: Security in AI (https://www.microsoft.com/videoplayer/embed/RE4voJF)

- As an industry we have made significant advancements in Privacy & security, fueled significantly by regulations like the GDPR (General Data Protection Regulation). 
- Yet with AI systems we must acknowledge the tension between the need for more personal data to make systems more personal and effective – and privacy. 
- Just like with the birth of connected computers with the internet, we are also seeing a huge uptick in the number of security issues related to AI. 
- At the same time, we have seen AI being used to improve security. As an example, most modern anti-virus scanners are driven by AI heuristics today. 
- We need to ensure that our Data Science processes blend harmoniously with the latest privacy and security practices. 


### Transparency
AI systems should be understandable. A crucial part of transparency is explaining the behavior of AI systems and their components. Improving the understanding of AI systems requires that stakeholders comprehend how and why they function so that they can identify potential performance issues, safety and privacy concerns, biases, exclusionary practices, or unintended outcomes. We also believe that those who use AI systems should be honest and forthcoming about when, why, and how they choose to deploy them. As well as the limitations of the systems they use. For example, if a bank uses an AI system to support its consumer lending decisions, it is important to examine the outcomes and understand which data influences the system’s recommendations. Governments are starting to regulate AI across industries, so data scientists and organizations must explain if an AI system meets regulatory requirements, especially when there is an undesirable outcome. 

> 🎥 Click here for a video: Transparency in AI (https://www.microsoft.com/videoplayer/embed/RE4voJF)

- Because AI systems are so complex, it is hard to understand how they work and interpret the results. 
- This lack of understanding affects the way these systems are managed, operationalized, and documented. 
- This lack of understanding more importantly affects the decisions made using the results these systems produce. 

### Accountability 
 
The people who design and deploy AI systems must be accountable for how their systems operate. The need for accountability is particularly crucial with sensitive use technologies like facial recognition. Recently, there has been a growing demand for facial recognition technology, especially from law enforcement organizations who see the potential of the technology in uses like finding missing children. However, these technologies could potentially be used by a government to put their citizens’ fundamental freedoms at risk by, for example, enabling continuous surveillance of specific individuals. Hence, data scientists and organizations need to be responsible for how their AI system impacts individuals or society.

[](https://www.youtube.com/watch?v=Wldt8P5V6D0 "Microsoft''s Approach to Responsible AI")

> 🎥 Click the image above for a video: Warnings of Mass Surveillance Through Facial Recognition 

Ultimately one of the biggest questions for our generation, as the first generation that is bringing AI to society, is how to ensure that computers will remain accountable to people and how to ensure that the people that design computers remain accountable to everyone else.

## Impact assessment 

Before training a machine learning model, it is important to conduct an impact assessment to understand the purpose of the AI system; what the intended use is; where it will be deployed; and who will be interacting with the system.  These are helpful for reviewer(s) or testers evaluating the system to know what factors to take into consideration when identifying potential risks and expected consequences.

The following are areas of focus when conducting an impact assessment:

* **Adverse impact on individuals**.  Being aware of any restriction or requirements, unsupported use or any known limitations hindering the system''s performance is vital to ensure that the system is not used in a way that could cause harm to individuals.
* **Data requirements**.  Gaining an understanding of how and where the system will use data enables reviewers to explore any data requirements you would need to be mindful of (e.g., GDPR or HIPAA data regulations).  In addition, examine whether the source or quantity of data is substantial for training.
* **Summary of impact**.  Gather a list of potential harms that could  arise from using the system.  Throughout the ML lifecycle, review if the issues identified are mitigated or addressed.
* **Applicable goals** for each of the six core principles.  Assess if the goals from each of the principles are met and if there are any gaps.


## Debugging with responsible AI  

Similar to debugging a software application, debugging an AI system is a necessary process of identifying and resolving issues in the system.  There are many factors that would affect a model not performing as expected or responsibly.  Most traditional model performance metrics are quantitative aggregates of a model''s performance, which are not sufficient to analyze how a model violates the responsible AI principles. Furthermore, a machine learning model is a black box that makes it difficult to understand what drives its outcome or provide explanation when it makes a mistake.  Later in this course, we will learn how to use the Responsible AI dashboard to help debug AI systems.  The dashboard provides a holistic tool for data scientists and AI developers to perform:

* **Error analysis**.  To identify the error distribution of the model that can affect the system''s fairness or reliability.
* **Model overview**. To discover where there are disparities in the model''s performance across data cohorts.
* **Data analysis**.  To understand the data distribution and identify any potential bias in the data that could lead to fairness, inclusiveness, and reliability issues.
* **Model interpretability**. To understand what affects or influences the model''s predictions. This helps in explaining the model''s behavior, which is important for transparency and accountability.


## 🚀 Challenge 
 
To prevent harms from being introduced in the first place, we should: 

- have a diversity of backgrounds and perspectives among the people working on systems 
- invest in datasets that reflect the diversity of our society 
- develop better methods throughout the machine learning lifecycle for detecting and correcting irresponsible AI when it occurs 

Think about real-life scenarios where a model''s untrustworthiness is evident in model-building and usage. What else should we consider? 

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)

## Review & Self Study 
 
In this lesson, you have learned some basics of the concepts of fairness and unfairness in machine learning.  
 
Watch this workshop to dive deeper into the topics: 

- In pursuit of responsible AI: Bringing principles to practice by Besmira Nushi, Mehrnoosh Sameki and Amit Sharma

[](https://www.youtube.com/watch?v=tGgJCrA-MZU "RAI Toolbox: An open-source framework for building responsible AI")

> 🎥 Click the image above for a video: RAI Toolbox: An open-source framework for building responsible AI by Besmira Nushi, Mehrnoosh Sameki, and Amit Sharma

Also, read: 

- Microsoft’s RAI resource center: Responsible AI Resources – Microsoft AI (https://www.microsoft.com/ai/responsible-ai-resources?activetab=pivot1%3aprimaryr4) 

- Microsoft’s FATE research group: FATE: Fairness, Accountability, Transparency, and Ethics in AI - Microsoft Research (https://www.microsoft.com/research/theme/fate/) 

RAI Toolbox: 

- Responsible AI Toolbox GitHub repository (https://github.com/microsoft/responsible-ai-toolbox)

Read about Azure Machine Learning''s tools to ensure fairness:

- Azure Machine Learning (https://docs.microsoft.com/azure/machine-learning/concept-fairness-ml?WT.mc_id=academic-77952-leestott) 

## Assignment

Explore RAI Toolbox (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/1-Introduction/3-fairness/assignment.md)',12);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'machine-learning-foundations-4','Techniques of Machine Learning',4,'# Techniques of Machine Learning

The process of building, using, and maintaining machine learning models and the data they use is a very different process from many other development workflows. In this lesson, we will demystify the process, and outline the main techniques you need to know. You will:

- Understand the processes underpinning machine learning at a high level.
- Explore base concepts such as ''models'', ''predictions'', and ''training data''.

## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)

[](https://youtu.be/4NGM0U2ZSHU "ML for beginners - Techniques of Machine Learning")

> 🎥 Click the image above for a short video working through this lesson.

## Introduction

On a high level, the craft of creating machine learning (ML) processes is comprised of a number of steps:

1. **Decide on the question**. Most ML processes start by asking a question that cannot be answered by a simple conditional program or rules-based engine. These questions often revolve around predictions based on a collection of data.
2. **Collect and prepare data**. To be able to answer your question, you need data. The quality and, sometimes, quantity of your data will determine how well you can answer your initial question. Visualizing data is an important aspect of this phase. This phase also includes splitting the data into a training and testing group to build a model.
3. **Choose a training method**. Depending on your question and the nature of your data, you need to choose how you want to train a model to best reflect your data and make accurate predictions against it. This is the part of your ML process that requires specific expertise and, often, a considerable amount of experimentation.
4. **Train the model**. Using your training data, you''ll use various algorithms to train a model to recognize patterns in the data. The model might leverage internal weights that can be adjusted to privilege certain parts of the data over others to build a better model.
5. **Evaluate the model**. You use never before seen data (your testing data) from your collected set to see how the model is performing.
6. **Parameter tuning**. Based on the performance of your model, you can redo the process using different parameters, or variables, that control the behavior of the algorithms used to train the model.
7. **Predict**. Use new inputs to test the accuracy of your model.

## What question to ask

Computers are particularly skilled at discovering hidden patterns in data. This utility is very helpful for researchers who have questions about a given domain that cannot be easily answered by creating a conditionally-based rules engine. Given an actuarial task, for example, a data scientist might be able to construct handcrafted rules around the mortality of smokers vs non-smokers.

When many other variables are brought into the equation, however, a ML model might prove more efficient to predict future mortality rates based on past health history. A more cheerful example might be making weather predictions for the month of April in a given location based on data that includes latitude, longitude, climate change, proximity to the ocean, patterns of the jet stream, and more.

✅ This slide deck (https://www2.cisl.ucar.edu/sites/default/files/2021-10/0900%20June%2024%20Haupt_0.pdf) on weather models offers a historical perspective for using ML in weather analysis.  

## Pre-building tasks

Before starting to build your model, there are several tasks you need to complete. To test your question and form a hypothesis based on a model''s predictions, you need to identify and configure several elements.

### Data

To be able to answer your question with any kind of certainty, you need a good amount of data of the right type. There are two things you need to do at this point:

- **Collect data**. Keeping in mind the previous lesson on fairness in data analysis, collect your data with care. Be aware of the sources of this data, any inherent biases it might have, and document its origin.
- **Prepare data**. There are several steps in the data preparation process. You might need to collate data and normalize it if it comes from diverse sources. You can improve the data''s quality and quantity through various methods such as converting strings to numbers (as we do in Clustering (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/5-Clustering/1-Visualize/README.md)). You might also generate new data, based on the original (as we do in Classification (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/4-Classification/1-Introduction/README.md)). You can clean and edit the data (as we will prior to the Web App (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/3-Web-App/README.md) lesson). Finally, you might also need to randomize it and shuffle it, depending on your training techniques.

✅ After collecting and processing your data, take a moment to see if its shape will allow you to address your intended question. It may be that the data will not perform well in your given task, as we discover in our Clustering (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/5-Clustering/1-Visualize/README.md) lessons!

### Features and Target

A feature (https://www.datasciencecentral.com/profiles/blogs/an-introduction-to-variable-and-feature-selection) is a measurable property of your data. In many datasets it is expressed as a column heading like ''date'' ''size'' or ''color''. Your feature variable, usually represented as `X` in code, represents the input variable which will be used to train a model.

A target is a thing you are trying to predict. Target, usually represented as `y` in code, represents the answer to the question you are trying to ask of your data: in December, what **color** pumpkins will be cheapest? in San Francisco, what neighborhoods will have the best real estate **price**? Sometimes target is also referred to as a label attribute.

### Selecting your feature variable

🎓 **Feature Selection and Feature Extraction** How do you know which variable to choose when building a model? You''ll probably go through a process of feature selection or feature extraction to choose the right variables for the most performant model. They''re not the same thing, however: "Feature extraction creates new features from functions of the original features, whereas feature selection returns a subset of the features." (source (https://wikipedia.org/wiki/Feature_selection))

### Visualize your data

An important aspect of the data scientist''s toolkit is the power to visualize data using several excellent libraries such as Seaborn or MatPlotLib. Representing your data visually might allow you to uncover hidden correlations that you can leverage. Your visualizations might also help you to uncover bias or unbalanced data (as we discover in Classification (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/4-Classification/2-Classifiers-1/README.md)).

### Split your dataset

Prior to training, you need to split your dataset into two or more parts of unequal size that still represent the data well.

- **Training**. This part of the dataset is fit to your model to train it. This set constitutes the majority of the original dataset.
- **Testing**. A test dataset is an independent group of data, often gathered from the original data, that you use to confirm the performance of the built model.
- **Validating**. A validation set is a smaller independent group of examples that you use to tune the model''s hyperparameters, or architecture, to improve the model. Depending on your data''s size and the question you are asking, you might not need to build this third set (as we note in Time Series Forecasting (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/7-TimeSeries/1-Introduction/README.md)).

## Building a model

Using your training data, your goal is to build a model, or a statistical representation of your data, using various algorithms to **train** it. Training a model exposes it to data and allows it to make assumptions about perceived patterns it discovers, validates, and accepts or rejects.

### Decide on a training method

Depending on your question and the nature of your data, you will choose a method to train it. Stepping through Scikit-learn''s documentation (https://scikit-learn.org/stable/user_guide.html) - which we use in this course - you can explore many ways to train a model. Depending on your experience, you might have to try several different methods to build the best model. You are likely to go through a process whereby data scientists evaluate the performance of a model by feeding it unseen data, checking for accuracy, bias, and other quality-degrading issues, and selecting the most appropriate training method for the task at hand.

### Train a model

Armed with your training data, you are ready to ''fit'' it to create a model. You will notice that in many ML libraries you will find the code ''model.fit'' - it is at this time that you send in your feature variable as an array of values (usually ''X'') and a target variable (usually ''y'').

### Evaluate the model

Once the training process is complete (it can take many iterations, or ''epochs'', to train a large model), you will be able to evaluate the model''s quality by using test data to gauge its performance. This data is a subset of the original data that the model has not previously analyzed. You can print out a table of metrics about your model''s quality.

🎓 **Model fitting**

In the context of machine learning, model fitting refers to the accuracy of the model''s underlying function as it attempts to analyze data with which it is not familiar.

🎓 **Underfitting** and **overfitting** are common problems that degrade the quality of the model, as the model fits either not well enough or too well. This causes the model to make predictions either too closely aligned or too loosely aligned with its training data. An overfit model predicts training data too well because it has learned the data''s details and noise too well. An underfit model is not accurate as it can neither accurately analyze its training data nor data it has not yet ''seen''.


> Infographic by Jen Looper (https://twitter.com/jenlooper)

## Parameter tuning

Once your initial training is complete, observe the quality of the model and consider improving it by tweaking its ''hyperparameters''. Read more about the process in the documentation (https://docs.microsoft.com/en-us/azure/machine-learning/how-to-tune-hyperparameters?WT.mc_id=academic-77952-leestott).

## Prediction

This is the moment where you can use completely new data to test your model''s accuracy. In an ''applied'' ML setting, where you are building web assets to use the model in production, this process might involve gathering user input (a button press, for example) to set a variable and send it to the model for inference, or evaluation.

In these lessons, you will discover how to use these steps to prepare, build, test, evaluate, and predict - all the gestures of a data scientist and more, as you progress in your journey to become a ''full stack'' ML engineer.

---

## 🚀Challenge

Draw a flow chart reflecting the steps of a ML practitioner. Where do you see yourself right now in the process? Where do you predict you will find difficulty? What seems easy to you?

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ml/)

## Review & Self Study

Search online for interviews with data scientists who discuss their daily work. Here is one (https://www.youtube.com/watch?v=Z3IjgbbCEfs).

## Assignment

Interview a data scientist (https://raw.githubusercontent.com/microsoft/ML-For-Beginners/de2d4e12236445198213a0711855e348e7253cd4/1-Introduction/4-techniques-of-ML/assignment.md)',9);
update public.books set status='APPROVED',published_at=now() where id=b;end if;
if not exists(select 1 from public.books where slug='data-science-foundations') then
insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values('data-science-foundations','Data Science Foundations','Microsoft and curriculum contributors','A chapter-based reading guide adapted from the openly licensed Data-Science-For-Beginners curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.','Mathematics & Data Science','English','https://github.com/microsoft/Data-Science-For-Beginners/tree/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f','MIT','https://github.com/microsoft/Data-Science-For-Beginners/blob/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/LICENSE','    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
','Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained. This is a reading adaptation, not a complete standalone edition.','https://github.com/microsoft/Data-Science-For-Beginners/blob/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/LICENSE','Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.',true,true,54) returning id into b;
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'data-science-foundations-1','Defining Data Science',1,'# Defining Data Science

|  ](../../sketchnotes/01-Definitions.png) |
| :----------------------------------------------------------------------------------------------------: |
|              Defining Data Science - _Sketchnote by @nitya (https://twitter.com/nitya)_               |

---

[](https://youtu.be/beZ7Mb_oz9I)

## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/0)

## What is Data?
In our everyday life, we are constantly surrounded by data. The text you are reading now is data.  The list of phone numbers of your friends in your smartphone is data, as well as the current time displayed on your watch. As human beings, we naturally operate with data by counting the money we have or by writing letters to our friends.

However, data became much more critical with the creation of computers.  The primary role of computers is to perform computations, but they need data to operate on.  Thus, we need to understand how computers store and process data.

With the emergence of the Internet, the role of computers as data handling devices increased.  If you think about it, we now use computers more and more for data processing and communication, rather than actual computations. When we write an e-mail to a friend or search for some information on the Internet - we are essentially creating, storing, transmitting, and manipulating data.
> Can you remember the last time you have used computers to actually compute something? 

## What is Data Science?

In Wikipedia (https://en.wikipedia.org/wiki/Data_science), **Data Science** is defined as *a scientific field that uses scientific methods to extract knowledge and insights from structured and unstructured data, and apply knowledge and actionable insights from data across a broad range of application domains*. 

This definition highlights the following important aspects of data science:

* The main goal of data science is to **extract knowledge** from data, in other words - to **understand** data, find some hidden relationships and build a **model**.
* Data science uses **scientific methods**, such as probability and statistics.  In fact, when the term *data science* was first introduced, some people argued that data science was just a new fancy name for statistics.  Nowadays it has become evident that the field is much broader.    
* Obtained knowledge should be applied to produce some **actionable insights**, i.e. practical insights that you can apply to real business situations.
* We should be able to operate on both **structured** and **unstructured** data.  We will come back to discuss different types of data later in the course.
* **Application domain** is an important concept, and data scientists often need at least some degree of expertise in the problem domain, for example: finance, medicine, marketing, etc.

> Another important aspect of Data Science is that it studies how data can be gathered, stored and operated upon using computers.  While statistics gives us mathematical foundations, data science applies mathematical concepts to actually draw insights from data.

One of the ways (attributed to Jim Gray (https://en.wikipedia.org/wiki/Jim_Gray_(computer_scientist))) to look at the data science is to consider it to be a separate paradigm of science:
* **Empirical**, in which we rely mostly on observations and results of experiments
* **Theoretical**, where new concepts emerge from existing scientific knowledge
* **Computational**, where we discover new principles based on some computational experiments
* **Data-Driven**, based on discovering relationships and patterns in the data  

## Other Related Fields

Since data is pervasive, data science itself is also a broad field, touching many other disciplines.


Databases

A critical consideration is how to store the data, i.e. how to structure it in a way that allows faster processing.  There are different types of databases that store structured and unstructured data, which we will consider in our course.

Big Data

Often we need to store and process very large quantities of data with a relatively simple structure.  There are special approaches and tools to store that data in a distributed manner on a computer cluster, and process it efficiently.

Machine Learning

One way to understand data is to build a model that will be able to predict a desired outcome.  Developing models from data is called machine learning. You may want to have a look at our Machine Learning for Beginners Curriculum to learn more about it.

Artificial Intelligence

An area of machine learning known as artificial intelligence (AI) also relies on data, and it involves building high complexity models that mimic human thought processes.  AI methods often allow us to turn unstructured data (e.g. natural language) into structured insights. 

Visualization

Vast amounts of data are incomprehensible for a human being, but once we create useful visualizations using that data, we can make more sense of the data, and draw some conclusions. Thus, it is important to know many ways to visualize information - something that we will cover in Section 3 of our course. Related fields also include Infographics, and Human-Computer Interaction in general. 



## Types of Data

As we have already mentioned, data is everywhere.  We just need to capture it in the right way!  It is useful to distinguish between **structured** and **unstructured** data. The former is typically represented in some well-structured form, often as a table or number of tables, while the latter is just a collection of files.  Sometimes we can also talk about **semi-structured** data, that have some sort of a structure that may vary greatly.

| Structured                                                                   | Semi-structured                                                                                | Unstructured                            |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| List of people with their phone numbers                                      | Wikipedia pages with links                                                                     | Text of Encyclopedia Britannica        |
| Temperature in all rooms of a building at every minute for the last 20 years | Collection of scientific papers in JSON format with authors, data of publication, and abstract | File share with corporate documents     |
| Data for age and gender of all people entering the building                  | Internet pages                                                                                 | Raw video feed from surveillance camera |

## Where to get Data

There are many possible sources of data, and it will be impossible to list all of them! However, let''s mention some of the typical places where you can get data:

* **Structured**
  - **Internet of Things** (IoT), including data from different sensors, such as temperature or pressure sensors, provides a lot of useful data.  For example, if an office building is equipped with IoT sensors, we can automatically control heating and lighting in order to minimize costs. 
  - **Surveys** that we ask users to complete after a purchase, or after visiting a web site.
  - **Analysis of behavior** can, for example, help us understand how deeply a user goes into a site, and what is the typical reason for leaving the site.
* **Unstructured**
  - **Texts** can be a rich source of insights, such as an overall **sentiment score**, or extracting keywords and semantic meaning.
  - **Images** or **Video**. A video from a surveillance camera can be used to estimate traffic on the road, and inform people about potential traffic jams.
  - Web server **Logs** can be used to understand which pages of our site are most often visited, and for how long.
* Semi-structured
  - **Social Network** graphs can be great sources of data about user personalities and potential effectiveness in spreading information around.
  - When we have a bunch of photographs from a party, we can try to extract **Group Dynamics** data by building a graph of people taking pictures with each other.

By knowing different possible sources of data, you can try to think about different scenarios where data science techniques can be applied to know the situation better, and to improve business processes. 

## What you can do with Data

In Data Science, we focus on the following steps of data journey:


1) Data Acquisition

The first step is to collect the data.  While in many cases it can be a straightforward process, like data coming to a database from a web application, sometimes we need to use special techniques. For example, data from IoT sensors can be overwhelming, and it is a good practice to use buffering endpoints such as IoT Hub to collect all the data before further processing.

2) Data Storage

Storing data can be challenging, especially if we are talking about big data.  When deciding how to store data, it makes sense to anticipate the way you would like to query the data in the future.  There are several ways data can be stored:

A relational database stores a collection of tables, and uses a special language called SQL to query them. Typically, tables are organized into different groups called schemas. In many cases we need to convert the data from original form to fit the schema.
A NoSQL database, such as CosmosDB, does not enforce schemas on data, and allows storing more complex data, for example, hierarchical JSON documents or graphs. However, NoSQL databases do not have the rich querying capabilities of SQL, and cannot enforce referential integrity, i.e. rules on how the data is structured in tables and governing the relationships between tables.
Data Lake storage is used for large collections of data in raw, unstructured form. Data lakes are often used with big data, where all data cannot fit on one machine, and has to be stored and processed by a cluster of servers. Parquet is the data format that is often used in conjunction with big data. 


3) Data Processing

This is the most exciting part of the data journey, which involves converting the data from its original form into a form that can be used for visualization/model training.  When dealing with unstructured data such as text or images, we may need to use some AI techniques to extract features from the data, thus converting it to structured form.

4) Visualization / Human Insights

Oftentimes, in order to understand the data, we need to visualize it.  Having many different visualization techniques in our toolbox, we can find the right view to make an insight.  Often, a data scientist needs to "play with data", visualizing it many times and looking for some relationships.  Also, we may use statistical techniques to test a hypotheses or prove a correlation between different pieces of data.   

5) Training a predictive model

Because the ultimate goal of data science is to be able to make decisions based on data, we may want to use the techniques of Machine Learning to build a predictive model.  We can then use this to make predictions using new data sets with similar structures.



Of course, depending on the actual data, some steps might be missing (e.g., when we already have the data in the database, or when we do not need model training), or some steps might be repeated several times (such as data processing).

## Digitalization and Digital Transformation

In the last decade, many businesses started to understand the importance of data when making business decisions.  To apply data science principles to running a business, one first needs to collect some data, i.e. translate business processes into digital form. This is known as **digitalization**.  Applying data science techniques to this data to guide decisions can lead to significant increases in productivity (or even business pivot), called **digital transformation**.

Let''s consider an example.  Suppose we have a data science course (like this one) which we deliver online to students, and we want to use data science to improve it.  How can we do it?

We can start by asking "What can be digitized?"  The simplest way would be to measure the time it takes each student to complete each module, and to measure the obtained knowledge by giving a multiple-choice test at the end of each module.  By averaging time-to-complete across all students, we can find out which modules cause the most difficulties for students, and work on simplifying them.

> You may argue that this approach is not ideal, because modules can be of different lengths.  It is probably more fair to divide the time by the length of the module (in number of characters), and compare those values instead.

When we start analyzing results of multiple-choice tests, we can try to determine which concepts that students have difficulty understanding, and use that information to improve the content.  To do that, we need to design tests in such a way that each question maps to a certain concept or chunk of knowledge.

If we want to get even more complicated, we can plot the time taken for each module against the age category of students.  We might find out that for some age categories it takes an inappropriately long time to complete the module, or that students drop out before completing it.  This can help us provide age recommendations for the module, and minimize people''s dissatisfaction from wrong expectations.

## 🚀 Challenge

In this challenge, we will try to find concepts relevant to the field of Data Science by looking at texts.  We will take a Wikipedia article on Data Science, download and process the text, and then build a word cloud like this one:



Visit `notebook.ipynb` (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/01-defining-data-science/notebook.ipynb%20'':ignore'') to read through the code.  You can also run the code, and see how it performs all data transformations in real time. 

> If you do not know how to run code in a Jupyter Notebook, have a look at this article (https://soshnikov.com/education/how-to-execute-notebooks-from-github/).



## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/1)

## Assignments

* **Task 1**: Modify the code above to find out related concepts for the fields of **Big Data** and **Machine Learning**
* **Task 2**: Think About Data Science Scenarios (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/01-defining-data-science/assignment.md)

## Credits

This lesson has been authored with ♥️ by Dmitry Soshnikov (http://soshnikov.com/)',12);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'data-science-foundations-2','Introduction to Data Ethics',2,'# Introduction to Data Ethics

| ](../../sketchnotes/02-Ethics.png)|
|:---:|
| Data Science Ethics - _Sketchnote by @nitya (https://twitter.com/nitya)_ |

---

We are all data citizens living in a datafied world.

Market trends tell us that by 2022, 1-in-3 large organizations will buy and sell their data through online Marketplaces and Exchanges (https://www.gartner.com/smarterwithgartner/gartner-top-10-trends-in-data-and-analytics-for-2020/). As **App Developers**, we''ll find it easier and cheaper to integrate data-driven insights and algorithm-driven automation into daily user experiences. But as AI becomes pervasive, we''ll also need to understand the potential harms caused by the weaponization (https://www.youtube.com/watch?v=TQHs8SA1qpk) of such algorithms at scale.

Trends suggest that by 2025, we will generate and consume over 180 zettabytes (https://www.statista.com/statistics/871513/worldwide-data-created/) of data. For **Data Scientists**, this explosion of information provides unprecedented access to personal and behavioral data. With it comes the power to build detailed user profiles and subtly influence decision-making—often in ways that foster an illusion of free choice (https://www.datasciencecentral.com/the-pareto-set-and-the-paradox-of-choice/). While this can be used to nudge users toward preferred outcomes, it also raises critical questions about data privacy, autonomy, and the ethical boundaries of algorithmic influence.

Data ethics are now _necessary guardrails_ for data science and engineering, helping us minimize potential harms and unintended consequences from our data-driven actions. The Gartner Hype Cycle for AI (https://www.gartner.com/smarterwithgartner/2-megatrends-dominate-the-gartner-hype-cycle-for-artificial-intelligence-2020/) identifies relevant trends in digital ethics, responsible AI, and AI governance as key drivers for larger megatrends around _democratization_ and _industrialization_ of AI.



In this lesson, we''ll explore the fascinating area of data ethics - from core concepts and challenges, to case studies and applied AI concepts like governance - that help establish an ethics culture in teams and organizations that work with data and AI.




## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/2) 🎯

## Basic Definitions

Let''s start by understanding the basic terminology.

The word "ethics" comes from the Greek word "ethikos" (https://en.wikipedia.org/wiki/Ethics) (and its root "ethos") meaning _character or moral nature_. 

**Ethics** is about the shared values and moral principles that govern our behavior in society. Ethics is based not on laws but on
widely accepted norms of what is "right vs. wrong". However, ethical considerations can influence corporate governance initiatives and government regulations that create more incentives for compliance.

**Data Ethics** is a new branch of ethics (https://royalsocietypublishing.org/doi/full/10.1098/rsta.2016.0360#sec-1) that "studies and evaluates moral problems related to _data, algorithms and corresponding practices_". Here, **"data"** focuses on actions related to generation, recording, curation, processing, dissemination, sharing, and usage, **"algorithms"** focuses on AI, agents, machine learning, and robots, and **"practices"** focuses on topics like responsible innovation, programming, hacking, and ethics codes.

**Applied Ethics** is the practical application of moral considerations (https://en.wikipedia.org/wiki/Applied_ethics). It''s the process of actively investigating ethical issues in the context of _real-world actions, products and processes_, and taking corrective measures to make that these remain aligned with our defined ethical values.

**Ethics Culture** is about _operationalizing_ applied ethics (https://hbr.org/2019/05/how-to-design-an-ethical-organization) to make sure that our ethical principles and practices are adopted in a consistent and scalable manner across the entire organization. Successful ethics cultures define organization-wide ethical principles, provide meaningful incentives for compliance, and reinforce ethics norms by encouraging and amplifying desired behaviors at every level of the organization.


## Ethics Concepts

In this section, we''ll discuss concepts like **shared values** (principles) and **ethical challenges** (problems) for data ethics - and explore **case studies** that help you understand these concepts in real-world contexts.

### 1. Ethics Principles

Every data ethics strategy begins by defining _ethical principles_ - the "shared values" that describe acceptable behaviors, and guide compliant actions, in our data & AI projects. You can define these at an individual or team level. However, most large organizations outline these in an _ethical AI_ mission statement or framework that is defined at corporate levels and enforced consistently across all teams.

**Example:** Microsoft''s Responsible AI (https://www.microsoft.com/en-us/ai/responsible-ai) mission statement reads: _"We are committed to the advancement of AI-driven by ethical principles that put people first"_ - identifying 6 ethical principles in the framework below:



Let''s briefly explore these principles. _Transparency_ and _accountability_ are foundational values that other principles built upon - so let''s begin there:

* **Accountability** (https://www.microsoft.com/en-us/ai/responsible-ai?activetab=pivot1:primaryr6) makes practitioners _responsible_ for their data & AI operations, and compliance with these ethical principles.
* **Transparency** (https://www.microsoft.com/en-us/ai/responsible-ai?activetab=pivot1:primaryr6) ensures that data and AI actions are _understandable_ (interpretable) to users, explaining the what and why behind decisions.
* **Fairness** (https://www.microsoft.com/en-us/ai/responsible-ai?activetab=pivot1%3aprimaryr6) - focuses on ensuring AI treats _all people_ fairly, addressing any systemic or implicit socio-technical biases in data and systems.
* **Reliability & Safety** (https://www.microsoft.com/en-us/ai/responsible-ai?activetab=pivot1:primaryr6) - ensures that AI behaves _consistently_ with defined values, minimizing potential harms or unintended consequences.
* **Privacy & Security** (https://www.microsoft.com/en-us/ai/responsible-ai?activetab=pivot1:primaryr6) - is about understanding data lineage, and providing _data privacy and related protections_ to users.
* **Inclusiveness** (https://www.microsoft.com/en-us/ai/responsible-ai?activetab=pivot1:primaryr6) - is about designing AI solutions with intention, adapting them to meet a _broad range of human needs_ & capabilities.

> 🚨 Think about what your data ethics mission statement could be. Explore ethical AI frameworks from other organizations - here are examples from IBM (https://www.ibm.com/cloud/learn/ai-ethics), Google (https://ai.google/principles), and Facebook (https://ai.facebook.com/blog/facebooks-five-pillars-of-responsible-ai/). What shared values do they have in common? How do these principles relate to the AI product or industry they operate in?

### 2. Ethics Challenges

Once we have ethical principles defined, the next step is to evaluate our data and AI actions to see if they align with those shared values. Think about your actions in two categories: _data collection_ and _algorithm design_. 

With data collection, actions will likely involve **personal data** or personally identifiable information (PII) for identifiable living individuals. This includes diverse items of non-personal data (https://ec.europa.eu/info/law/law-topic/data-protection/reform/what-personal-data_en) that _collectively_ identify an individual. Ethical challenges can relate to _data privacy_, _data ownership_, and related topics like _informed consent_ and _intellectual property rights_ for users.

With algorithm design, actions will involve collecting & curating **datasets**, then using them to train & deploy **data models** that predict outcomes or automate decisions in real-world contexts. Ethical challenges can arise from _dataset bias_, _data quality_ issues, _unfairness_ ,and _misrepresentation_ in algorithms - including some issues that are systemic in nature.

In both cases, ethics challenges highlight areas where our actions may encounter conflict with our shared values. To detect, mitigate, minimize, or eliminate, these concerns - we need to ask moral "yes/no" questions related to our actions, then take corrective actions as needed. Let''s take a look at some ethical challenges and the moral questions they raise:


#### 2.1 Data Ownership

Data collection often involves personal data that can identify the data subjects. Data ownership (https://permission.io/blog/data-ownership) is about _control_ and _user rights_ (https://permission.io/blog/data-ownership) related to the creation, processing ,and dissemination of data. 

The moral questions we need to ask are: 
 * Who owns the data? (user or organization)
 * What rights do data subjects have? (ex: access, erasure, portability)
 * What rights do organizations have? (ex: rectify malicious user reviews)

#### 2.2 Informed Consent

Informed consent (https://legaldictionary.net/informed-consent/) defines the act of users agreeing to an action (like data collection) with a _full understanding_ of relevant facts including the purpose, potential risks, and alternatives. 

Questions to explore here are:
 * Did the user (data subject) give permission for data capture and usage?
 * Did the user understand the purpose for which that data was captured?
 * Did the user understand the potential risks from  their participation?

#### 2.3 Intellectual Property

Intellectual property (https://en.wikipedia.org/wiki/Intellectual_property) refers to intangible creations resulting from the human initiative, that may _have economic value_ to individuals or businesses. 

Questions to explore here are:
 * Did the collected data have economic value to a user or business?
 * Does the **user** have intellectual property here?
 * Does the **organization** have intellectual property here?
 * If these rights exist, how are we protecting them?

#### 2.4 Data Privacy

Data privacy (https://www.northeastern.edu/graduate/blog/what-is-data-privacy/) or information privacy refers to the preservation of user privacy and protection of user identity with respect to personally identifiable information. 

Questions to explore here are:
 * Is users'' (personal) data secured against hacks and leaks?
 * Is users'' data accessible only to authorized users and contexts?
 * Is users'' anonymity preserved when data is shared or disseminated?
 * Can a user be de-identified from anonymized datasets?


#### 2.5 Right To Be Forgotten

The Right To Be Forgotten (https://en.wikipedia.org/wiki/Right_to_be_forgotten) or Right to Erasure (https://www.gdpreu.org/right-to-be-forgotten/) provides additional personal data protection to users. Specifically, it gives users the right to request deletion or removal of personal data from Internet searches and other locations, _under specific circumstances_ - allowing them a fresh start online without past actions being held against them.

Questions to explore here are:
 * Does the system allow data subjects to request erasure?
 * Should the withdrawal of user consent trigger automated erasure?
 * Was data collected without consent or by unlawful means?
 * Are we compliant with government regulations for data privacy?


#### 2.6 Dataset Bias

Dataset or Collection Bias (http://researcharticles.com/index.php/bias-in-data-collection-in-research/) is about selecting a _non-representative_ subset of data for algorithm development, creating potential  unfairness in result outcomes for diverse groups. Types of bias include selection or sampling bias, volunteer bias, and instrument bias. 

Questions to explore here are:
 * Did we recruit a representative set of data subjects?
 * Did we test our collected or curated dataset for various biases?
 * Can we mitigate or remove any discovered biases?

#### 2.7 Data Quality

Data Quality (https://lakefs.io/data-quality-testing/) looks at the validity of the curated dataset used to develop our algorithms, checking to see if features and records meet requirements for the level of accuracy and consistency needed for our AI purpose.

Questions to explore here are:
 * Did we capture valid _features_ for our use case?
 * Was data captured _consistently_ across diverse data sources?
 * Is the dataset _complete_ for diverse conditions or scenarios?
 * Is information captured _accurately_ in reflecting reality?

#### 2.8 Algorithm Fairness

Algorithm Fairness (https://towardsdatascience.com/what-is-algorithm-fairness-3182e161cf9f) checks to see if the algorithm design systematically discriminates against specific subgroups of data subjects leading to potential harms (https://docs.microsoft.com/en-us/azure/machine-learning/concept-fairness-ml) in _allocation_ (where resources are denied or withheld from that group) and _quality of service_ (where AI is not as accurate for some subgroups as it is for others). 

Questions to explore here are:
 * Did we evaluate model accuracy for diverse subgroups and conditions?
 * Did we scrutinize the system for potential harms (e.g., stereotyping)?
 * Can we revise data or retrain models to mitigate identified harms?

Explore resources like AI Fairness checklists (https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4t6dA) to learn more.

#### 2.9 Misrepresentation

Data Misrepresentation (https://www.sciencedirect.com/topics/computer-science/misrepresentation) is about asking whether we are communicating insights from honestly reported data in a deceptive manner to support a desired narrative. 

Questions to explore here are:
 * Are we reporting incomplete or inaccurate data?
 * Are we visualizing data in a manner that drives misleading conclusions?
 * Are we using selective statistical techniques to manipulate outcomes?
 * Are there alternative explanations that may offer a different conclusion?

#### 2.10 Free Choice
The Illusion of Free Choice (https://www.datasciencecentral.com/profiles/blogs/the-illusion-of-choice) occurs when system "choice architectures" use decision-making algorithms to nudge people towards taking a preferred outcome while seeming to give them options and control. These dark patterns (https://www.darkpatterns.org/) can cause social and economic harm to users. Because user decisions impact behavior profiles, these actions potentially drive future choices that can amplify or extend the impact of these harms.

Questions to explore here are:
 * Did the user understand the implications of making that choice?
 * Was the user aware of (alternative) choices and the pros & cons of each?
 * Can the user reverse an automated or influenced choice later?

### 3. Case Studies

To put these ethical challenges in real-world contexts, it helps to look at case studies that highlight the potential harms and consequences to individuals and society, when such ethics violations are overlooked. 

Here are a few examples:

| Ethics Challenge | Case Study  | 
|--- |--- |
| **Informed Consent** | 1972 - Tuskegee Syphilis Study (https://en.wikipedia.org/wiki/Tuskegee_Syphilis_Study) - African American men who participated in the study were promised free medical care _but deceived_ by researchers who failed to inform subjects of their diagnosis or about availability of treatment. Many subjects died & partners or children were affected; the study lasted 40 years. | 
| **Data Privacy** |  2007 - The Netflix data prize (https://www.wired.com/2007/12/why-anonymous-data-sometimes-isnt/) provided researchers with _10M anonymized movie rankings from 50K customers_ to help improve recommendation algorithms. However, researchers were able to correlate anonymized data with personally-identifiable data in _external datasets_ (e.g., IMDb comments) - effectively "de-anonymizing" some Netflix subscribers.|
| **Collection Bias**  | 2013 - The City of Boston developed Street Bump (https://www.boston.gov/transportation/street-bump), an app that let citizens report potholes, giving the city better roadway data to find and fix issues. However, people in lower income groups had less access to cars and phones (https://hbr.org/2013/04/the-hidden-biases-in-big-data), making their roadway issues invisible in this app. Developers worked with academics to _equitable access and digital divides_ issues for fairness. |
| **Algorithmic Fairness**  | 2018 - The MIT Gender Shades Study (http://gendershades.org/overview.html) evaluated the accuracy of gender classification AI products, exposing gaps in accuracy for women and persons of color. A 2019 Apple Card (https://www.wired.com/story/the-apple-card-didnt-see-genderand-thats-the-problem/) seemed to offer less credit to women than men. Both illustrated issues in algorithmic bias leading to socio-economic harms.|
| **Data Misrepresentation** | 2020 - The Georgia Department of Public Health released COVID-19 charts (https://www.vox.com/covid-19-coronavirus-us-response-trump/2020/5/18/21262265/georgia-covid-19-cases-declining-reopening) that appeared to mislead citizens about trends in confirmed cases with non-chronological ordering on the x-axis. This illustrates misrepresentation through visualization tricks. |
| **Illusion of free choice** | 2020 - Learning app ABCmouse paid $10M to settle an FTC complaint (https://www.washingtonpost.com/business/2020/09/04/abcmouse-10-million-ftc-settlement/) where parents were trapped into paying for subscriptions they couldn''t cancel. This illustrates dark patterns in choice architectures, where users were nudged towards potentially harmful choices. |
| **Data Privacy & User Rights** | 2021 - Facebook Data Breach (https://www.npr.org/2021/04/09/986005820/after-data-breach-exposes-530-million-facebook-says-it-will-not-notify-users) exposed data from 530M users, resulting in a $5B settlement to the FTC. It however refused to notify users of the breach violating user rights around data transparency and access. |

Want to explore more case studies? Check out these resources:
* Ethics Unwrapped (https://ethicsunwrapped.utexas.edu/case-studies) - ethics dilemmas across diverse industries. 
* Data Science Ethics course (https://www.coursera.org/learn/data-science-ethics#syllabus) - landmark case studies explored.
* Where things have gone wrong (https://deon.drivendata.org/examples/) - deon checklist with examples

> 🚨 Think about the case studies you''ve seen - have you experienced, or been affected by, a similar ethical challenge in your life? Can you think of at least one other case study that illustrates one of the ethical challenges we''ve discussed in this section?

## Applied Ethics

We''ve talked about ethics concepts, challenges ,and case studies in real-world contexts. But how do we get started _applying_ ethical principles and practices in our projects? And how do we _operationalize_ these practices for better governance? Let''s explore some real-world solutions: 

### 1. Professional Codes

Professional Codes offer one option for organizations to "incentivize" members to support their ethical principles and mission statement. Codes are _moral guidelines_ for professional behavior, helping employees or members make decisions that align with their organization''s principles. They are only as good as the voluntary compliance from members; however, many organizations offer additional rewards and penalties to motivate compliance from members.

Examples include:

 * Oxford Munich (http://www.code-of-ethics.org/code-of-conduct/) Code of Ethics
 * Data Science Association (http://datascienceassn.org/code-of-conduct.html) Code of Conduct (created 2013)
 * ACM Code of Ethics and Professional Conduct (https://www.acm.org/code-of-ethics) (since 1993)

> 🚨 Do you belong to a professional engineering or data science organization? Explore their site to see if they define a professional code of ethics. What does this say about their ethical principles? How are they "incentivizing" members to follow the code?

### 2. Ethics Checklists

While professional codes define required _ethical behavior_ from practitioners, they have known limitations (https://resources.oreilly.com/examples/0636920203964/blob/master/of_oaths_and_checklists.md) in enforcement, particularly in large-scale projects. Instead, many data Science experts advocate for checklists (https://resources.oreilly.com/examples/0636920203964/blob/master/of_oaths_and_checklists.md), that can **connect principles to practices** in more deterministic and actionable ways. 

Checklists convert questions into "yes/no" tasks that can be operationalized, allowing them to be tracked as part of standard product release workflows. 

Examples include:
 * Deon (https://deon.drivendata.org/) - a general-purpose data ethics checklist created from industry recommendations (https://deon.drivendata.org/#checklist-citations) with a command-line tool for easy integration.
 * Privacy Audit Checklist (https://cyber.harvard.edu/ecommerce/privacyaudit.html) - provides general guidance for information handling practices from legal and social exposure perspectives.
 * AI Fairness Checklist (https://www.microsoft.com/en-us/research/project/ai-fairness-checklist/) - created by AI practitioners to support the adoption and integration of fairness checks into AI development cycles.
 * 22 questions for ethics in data and AI (https://medium.com/the-organization/22-questions-for-ethics-in-data-and-ai-efb68fd19429) - more open-ended framework, structured for initial exploration of ethical issues in design, implementation, and organizational, contexts.

### 3. Ethics Regulations

Ethics is about defining shared values and doing the right thing _voluntarily_. **Compliance** is about _following the law_ if and where defined. **Governance** broadly covers all the ways in which organizations operate to enforce ethical principles and comply with established laws.

Today, governance takes two forms within organizations. First, it''s about defining **ethical AI** principles and establishing practices to operationalize adoption across all AI-related projects in the organization. Second, it''s about complying with all government-mandated **data protection regulations** for regions it operates in.

Examples of data protection and privacy regulations:

 * `1974`, US Privacy Act (https://www.justice.gov/opcl/privacy-act-1974) - regulates _federal govt._ collection, use ,and disclosure of personal information.
 * `1996`, US Health Insurance Portability & Accountability Act (HIPAA) (https://www.cdc.gov/phlp/publications/topic/hipaa.html) - protects personal health data.
 * `1998`, US Children''s Online Privacy Protection Act (COPPA) (https://www.ftc.gov/enforcement/rules/rulemaking-regulatory-reform-proceedings/childrens-online-privacy-protection-rule) - protects data privacy of children under 13.
 * `2018`, General Data Protection Regulation (GDPR) (https://gdpr-info.eu/) - provides user rights, data protection ,and privacy.
 * `2018`, California Consumer Privacy Act (CCPA) (https://www.oag.ca.gov/privacy/ccpa) gives consumers more _rights_ over their (personal) data.
 * `2021`, China''s Personal Information Protection Law (https://www.reuters.com/world/china/china-passes-new-personal-data-privacy-law-take-effect-nov-1-2021-08-20/) just passed, creating one of the strongest online data privacy regulations worldwide.

> 🚨 The European Union defined GDPR (General Data Protection Regulation) remains one of the most influential data privacy regulations today. Did you know it also defines 8 user rights (https://www.freeprivacypolicy.com/blog/8-user-rights-gdpr) to protect citizens'' digital privacy and personal data? Learn about what these are, and why they matter.


### 4. Ethics Culture

Note that there remains an intangible gap between _compliance_ (doing enough to meet "the letter of the law") and addressing systemic issues (https://www.coursera.org/learn/data-science-ethics/home/week/4) (like ossification, information asymmetry, and distributional unfairness) that can speed up the weaponization of AI. 

The latter requires collaborative approaches to defining ethics cultures (https://towardsdatascience.com/why-ai-ethics-requires-a-culture-driven-approach-26f451afa29f) that build emotional connections and consistent shared values _across organizations_ in the industry. This calls for more formalized data ethics cultures (https://www.codeforamerica.org/news/formalizing-an-ethical-data-culture/) in organizations - allowing _anyone_ to pull the Andon cord (https://en.wikipedia.org/wiki/Andon_(manufacturing)) (to raise ethics concerns early in the process) and making _ethical assessments_ (e.g., in hiring) a core criteria team formation in AI projects.

---
## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/3) 🎯
## Review & Self Study 

Courses and books help with understanding core ethics concepts and challenges, while case studies and tools help with applied ethics practices in real-world contexts. Here are a few resources to start with.

* Machine Learning For Beginners (https://github.com/microsoft/ML-For-Beginners/blob/main/1-Introduction/3-fairness/README.md) - lesson on Fairness, from Microsoft.
* Principles of Responsible AI (https://docs.microsoft.com/en-us/learn/modules/responsible-ai-principles/) - free learning path from Microsoft Learn.
* Ethics and Data Science (https://resources.oreilly.com/examples/0636920203964) - O''Reilly EBook (M. Loukides, H. Mason et. al)
* Data Science Ethics (https://www.coursera.org/learn/data-science-ethics#syllabus) - online course from the University of Michigan.
* Ethics Unwrapped (https://ethicsunwrapped.utexas.edu/case-studies) - case studies from the University of Texas.

# Assignment 

Write A Data Ethics Case Study (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/02-ethics/assignment.md)',17);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'data-science-foundations-3','Defining Data',3,'# Defining Data

| ](../../sketchnotes/03-DefiningData.png)|
|:---:|
|Defining Data - _Sketchnote by @nitya (https://twitter.com/nitya)_ |

Data is facts, information, observations and measurements that are used to make discoveries and to support informed decisions. A data point is a single unit of data with in a dataset, which is collection of data points. Datasets may come in different formats and structures, and will usually be based on its source, or where the data came from. For example, a company''s monthly earnings might be in a spreadsheet but hourly heart rate data from a smartwatch may be in JSON (https://stackoverflow.com/a/383699) format. It''s common for data scientists to work with different types of data within a dataset. 

This lesson focuses on identifying and classifying data by its characteristics and its sources.

## Pre-Lecture Quiz (https://ff-quizzes.netlify.app/en/ds/quiz/4)
## How Data is Described

### Raw Data
Raw data is data that has come from its source in its initial state and has not been analyzed or organized. In order to make sense of what is happening with a dataset, it needs to be organized into a format that can be understood by humans as well as the technology they may use to analyze it further. The structure of a dataset describes how it''s organized and can be classified at structured, unstructured and semi-structured. These types of structure will vary, depending on the source but will ultimately fit in these three categories. 

### Quantitative Data
Quantitative data is numerical observations within a dataset and can typically be analyzed, measured and used mathematically. Some examples of quantitative data are: a country''s population, a person''s height or a company''s quarterly earnings. With some additional analysis, quantitative data could be used to discover seasonal trends of the Air Quality Index (AQI) or estimate the probability of rush hour traffic on a typical work day.

### Qualitative Data
Qualitative data, also known as categorical data is data that cannot be measured objectively like observations of quantitative data. It''s generally various formats of subjective data that captures the quality of something, such as a product or process. Sometimes, qualitative data is numerical and wouldn''t be typically used mathematically, like phone numbers or timestamps. Some examples of qualitative data are: video comments, the make and model of a car or your closest friends'' favorite color. Qualitative data could be used to understand which products consumers like best or identifying popular keywords in job application resumes.

### Structured Data
Structured data is data that is organized into rows and columns, where each row will have the same set of columns. Columns represent a value of a particular type and will be identified with a name describing what the value represents, while rows contain the actual values. Columns will often have a specific set of rules or restrictions on the values, to ensure that the values accurately represent the column. For example imagine a spreadsheet of customers where each row must have a phone number and the phone numbers never contain alphabetical characters. There may be rules applied on the phone number column to make sure it''s never empty and only contains numbers. 

A benefit of structured data is that it can be organized in such a way that it can be related to other structured data. However, because the data is designed to be organized in a specific way, making changes to its overall structure can take a lot of effort to do. For example, adding an email column to the customer spreadsheet that cannot be empty means you''ll need figure out how you''ll add these values to the existing rows of customers in the dataset. 

Examples of structured data: spreadsheets, relational databases, phone numbers, bank statements

### Unstructured Data
Unstructured data typically cannot be categorized into rows or columns and doesn''t contain a format or set of rules to follow. Because unstructured data has less restrictions on its structure it''s easier to add new information in comparison to a structured dataset. If a sensor capturing data on barometric pressure every 2 minutes has received an update that now allows it to measure and record temperature, it doesn''t require altering the existing data if it''s unstructured. However, this may make analyzing or investigating this type of data take longer. For example, a scientist who wants to find the average temperature of the previous month from the sensors data, but discovers that the sensor recorded an "e" in some of its recorded data to note that it was broken instead of a typical number, which means the data is incomplete.

Examples of unstructured data: text files, text messages, video files

### Semi-structured
Semi-structured data has features that make it a combination of structured and unstructured data. It doesn''t typically conform to a format of rows and columns but is organized in a way that is considered structured and may follow a fixed format or set of rules. The structure will vary between sources, such as a well defined hierarchy to something more flexible that allows for easy integration of new information. Metadata are indicators that help decide how the data is organized and stored and will have various names, based on the type of data. Some common names for metadata are tags, elements, entities and attributes. For example, a typical email message will have a subject, body and a set of recipients and can be organized by whom or when it was sent. 

Examples of semi-structured data: HTML, CSV files, JavaScript Object Notation (JSON)

## Sources of Data 

A data source is the initial location of where the data was generated, or where it "lives" and will vary based on how and when it was collected. Data generated by its user(s) are known as primary data while secondary data comes from a source that has collected data for general use. For example, a group of scientists collecting observations in a rainforest would be considered primary and if they decide to share it with other scientists it would be considered secondary to those that use it. 

Databases are a common source and rely on a database management system to host and maintain the data where users use commands called queries to explore the data. Files as data sources can be audio, image, and video files as well as spreadsheets like Excel. Internet sources are a common location for hosting data, where databases as well as files can be found. Application programming interfaces, also known as APIs allow programmers to create ways to share data with external users through the internet, while the process of web scraping extracts data from a web page. The lessons in Working with Data (https://raw.githubusercontent.com/2-Working-With-Data) focus on how to use various data sources. 

## Conclusion

In this lesson we have learned:

- What data is
- How data is described
- How data is classified and categorized
- Where data can be found

## 🚀 Challenge

Kaggle is an excellent source of open datasets. Use the dataset search tool (https://www.kaggle.com/datasets) to find some interesting datasets and classify 3-5 datasets with this criteria:

- Is the data quantitative or qualitative?
- Is the data structured, unstructured, or semi-structured?

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/5)



## Review & Self Study

- This Microsoft Learn unit, titled Identify data formats (https://learn.microsoft.com/en-us/training/modules/explore-core-data-concepts/2-data-formats?pivots=text) has a detailed breakdown of structured, semi-structured, and unstructured data.

## Assignment

Classifying Datasets (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/03-defining-data/assignment.md)',7);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'data-science-foundations-4','A Brief Introduction to Statistics and Probability',4,'# A Brief Introduction to Statistics and Probability

| ](../../sketchnotes/04-Statistics-Probability.png)|
|:---:|
| Statistics and Probability - _Sketchnote by @nitya (https://twitter.com/nitya)_ |

Statistics and Probability Theory are two highly related areas of Mathematics that are highly relevant to Data Science. It is possible to operate with data without deep knowledge of mathematics, but it is still better to know at least some basic concepts. Here we will present a short introduction that will help you get started.

[](https://youtu.be/Z5Zy85g4Yjw)


## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/6)

## Probability and Random Variables

**Probability** is a number between 0 and 1 that expresses how probable an **event** is. It is defined as a number of positive outcomes (that lead to the event), divided by total number of outcomes, given that all outcomes are equally probable. For example, when we roll a dice, the probability that we get an even number is 3/6 = 0.5.

When we talk about events, we use **random variables**. For example, the random variable that represents a number obtained when rolling a dice would take values from 1 to 6. Set of numbers from 1 to 6 is called **sample space**. We can talk about the probability of a random variable taking a certain value, for example P(X=3)=1/6.

The random variable in previous example is called **discrete**, because it has a countable sample space, i.e. there are separate values that can be enumerated. There are cases when sample space is a range of real numbers, or the whole set of real numbers. Such variables are called **continuous**. A good example is the time when the bus arrives.

## Probability Distribution

In the case of discrete random variables, it is easy to describe the probability of each event by a function P(X). For each value *s* from sample space *S* it will give a number from 0 to 1, such that the sum of all values of P(X=s) for all events would be 1.

The most well-known discrete distribution is **uniform distribution**, in which there is a sample space of N elements, with equal probability of 1/N for each of them. 

It is more difficult to describe the probability distribution of a continuous variable, with values drawn from some interval [a,b], or the whole set of real numbers &Ropf;. Consider the case of bus arrival time. In fact, for each exact arrival time *t*, the probability of a bus arriving at exactly that time is 0!

> Now you know that events with 0 probability happen, and very often! At least each time when the bus arrives!

We can only talk about the probability of a variable falling in a given interval of values, eg. P(t1&le;X&lt;t2). In this case, probability distribution is described by a **probability density function** p(x), such that


  
A continuous analog of uniform distribution is called **continuous uniform**, which is defined on a finite interval. A probability that the value X falls into an interval of length l is proportional to l, and rises up to 1.

Another important distribution is **normal distribution**, which we will talk about in more detail below.

## Mean, Variance and Standard Deviation

Suppose we draw a sequence of n samples of a random variable X: x1, x2, ..., xn. We can define **mean** (or **arithmetic average**) value of the sequence in the traditional way as (x1+x2+xn)/n. As we grow the size of the sample (i.e. take the limit with n&rarr;&infin;), we will obtain the mean (also called **expectation**) of the distribution. We will denote expectation by **E**(x).

> It can be demonstrated that for any discrete distribution with values {x1, x2, ..., xN} and corresponding probabilities p1, p2, ..., pN, the expectation would equal to E(X)=x1p1+x2p2+...+xNpN.

To identify how far the values are spread, we can compute the variance &sigma;2 = &sum;(xi - &mu;)2/n, where &mu; is the mean of the sequence. The value &sigma; is called **standard deviation**, and &sigma;2 is called a **variance**.

## Mode, Median and Quartiles

Sometimes, mean does not adequately represent the "typical" value for data. For example, when there are a few extreme values that are completely out of range, they can affect the mean. Another good indication is a **median**, a value such that half of data points are lower than it, and another half - higher.

To help us understand the distribution of data, it is helpful to talk about **quartiles**:

* First quartile, or Q1, is a value, such that 25% of the data fall below it
* Third quartile, or Q3, is a value that 75% of the data fall below it

Graphically we can represent relationship between median and quartiles in a diagram called the **box plot**:



Here we also compute **inter-quartile range** IQR=Q3-Q1, and so-called **outliers** - values, that lie outside the boundaries [Q1-1.5*IQR,Q3+1.5*IQR].

For finite distribution that contains a small number of possible values, a good "typical" value is the one that appears the most frequently, which is called **mode**. It is often applied to categorical data, such as colors. Consider a situation when we have two groups of people - some that strongly prefer red, and others who prefer blue. If we code colors by numbers, the mean value for a favorite color would be somewhere in the orange-green spectrum, which does not indicate the actual preference on neither group. However, the mode would be either one of the colors, or both colors, if the number of people voting for them is equal (in this case we call the sample **multimodal**).
## Real-world Data

When we analyze data from real life, they often are not random variables as such, in a sense that we do not perform experiments with unknown result. For example, consider a team of baseball players, and their body data, such as height, weight and age. Those numbers are not exactly random, but we can still apply the same mathematical concepts. For example, a sequence of people''s weights can be considered to be a sequence of values drawn from some random variable. Below is the sequence of weights of actual baseball players from Major League Baseball (http://mlb.mlb.com/index.jsp), taken from this dataset (http://wiki.stat.ucla.edu/socr/index.php/SOCR_Data_MLB_HeightsWeights) (for your convenience, only first 20 values are shown):

```
[180.0, 215.0, 210.0, 210.0, 188.0, 176.0, 209.0, 200.0, 231.0, 180.0, 188.0, 180.0, 185.0, 160.0, 180.0, 185.0, 197.0, 189.0, 185.0, 219.0]
```

> **Note**: To see the example of working with this dataset, have a look at the accompanying notebook (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/04-stats-and-probability/notebook.ipynb). There are also a number of challenges throughout this lesson, and you may complete them by adding some code to that notebook. If you are not sure how to operate on data, do not worry - we will come back to working with data using Python at a later time. If you do not know how to run code in Jupyter Notebook, have a look at this article (https://soshnikov.com/education/how-to-execute-notebooks-from-github/).

Here is the box plot showing mean, median and quartiles for our data:



Since our data contains information about different player **roles**, we can also do the box plot by role - it will allow us to get the idea on how parameters values differ across roles. This time we will consider height:



This diagram suggests that, on average, height of first basemen is higher that height of second basemen. Later in this lesson we will learn how we can test this hypothesis more formally, and how to demonstrate that our data is statistically significant to show that.

> When working with real-world data, we assume that all data points are samples drawn from some probability distribution. This assumption allows us to apply machine learning techniques and build working predictive models.

To see what the distribution of our data is, we can plot a graph called a **histogram**. X-axis would contain a number of different weight intervals (so-called **bins**), and the vertical axis would show the number of times our random variable sample was inside a given interval. 



From this histogram you can see that all values are centered around certain mean weight, and the further we go from that weight - the fewer weights of that value are encountered. I.e., it is very improbable that the weight of a baseball player would be very different from the mean weight. Variance of weights show the extent to which weights are likely to differ from the mean.

> If we take weights of other people, not from the baseball league, the distribution is likely to be different. However, the shape of the distribution will be the same, but mean and variance would change. So, if we train our model on baseball players, it is likely to give wrong results when applied to students of a university, because the underlying distribution is different.
## Normal Distribution

The distribution of weights that we have seen above is very typical, and many measurements from real world follow the same type of distribution, but with different mean and variance. This distribution is called **normal distribution**, and it plays a very important role in statistics.

Using normal distribution is a correct way to generate random weights of potential baseball players. Once we know mean weight `mean` and standard deviation `std`, we can generate 1000 weight samples in the following way:
```python
samples = np.random.normal(mean,std,1000)
``` 

If we plot the histogram of the generated samples we will see the picture very similar to the one shown above. And if we increase the number of samples and the number of bins, we can generate a picture of a normal distribution that is more close to ideal:



*Normal Distribution with mean=0 and std.dev=1*

## Confidence Intervals

When we talk about weights of baseball players, we assume that there is certain **random variable W** that corresponds to ideal probability distribution of weights of all baseball players (so-called **population**). Our sequence of weights corresponds to a subset of all baseball players that we call **sample**. An interesting question is, can we know the parameters of distribution of W, i.e. mean and variance of the population?

The easiest answer would be to calculate mean and variance of our sample. However, it could happen that our random sample does not accurately represent complete population. Thus it makes sense to talk about **confidence interval**.

> **Confidence interval** is the estimation of true mean of the population given our sample, which is accurate is a certain probability (or **level of confidence**).

Suppose we have a sample X1, ..., Xn from our distribution. Each time we draw a sample from our distribution, we would end up with different mean value &mu;. Thus &mu; can be considered to be a random variable. A **confidence interval** with confidence p is a pair of values (Lp,Rp), such that **P**(Lp&leq;&mu;&leq;Rp) = p, i.e. a probability of measured mean value falling within the interval equals to p.

It does beyond our short intro to discuss in detail how those confidence intervals are calculated. Some more details can be found on Wikipedia (https://en.wikipedia.org/wiki/Confidence_interval). In short, we define the distribution of computed sample mean relative to the true mean of the population, which is called **student distribution**.

> **Interesting fact**: Student distribution is named after mathematician William Sealy Gosset, who published his paper under the pseudonym "Student". He worked in the Guinness brewery, and, according to one of the versions, his employer did not want general public to know that they were using statistical tests to determine the quality of raw materials.

If we want to estimate the mean &mu; of our population with confidence p, we need to take *(1-p)/2-th percentile* of a Student distribution A, which can either be taken from tables, or computer using some built-in functions of statistical software (eg. Python, R, etc.). Then the interval for &mu; would be given by X&pm;A*D/&radic;n, where X is the obtained mean of the sample, D is the standard deviation.

> **Note**: We also omit the discussion of an important concept of degrees of freedom (https://en.wikipedia.org/wiki/Degrees_of_freedom_(statistics)), which is important in relation to Student distribution. You can refer to more complete books on statistics to understand this concept deeper.

An example of calculating confidence interval for weights and heights is given in the accompanying notebooks (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/04-stats-and-probability/notebook.ipynb).

| p | Weight mean |
|-----|-----------|
| 0.85 | 201.73±0.94 |
| 0.90 | 201.73±1.08 |
| 0.95 | 201.73±1.28 |

Notice that the higher is the confidence probability, the wider is the confidence interval. 

## Hypothesis Testing 

In our baseball players dataset, there are different player roles, that can be summarized below (look at the accompanying notebook (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/04-stats-and-probability/notebook.ipynb) to see how this table can be calculated):

| Role | Height | Weight | Count |
|------|--------|--------|-------|
| Catcher | 72.723684 | 204.328947 | 76 |
| Designated_Hitter | 74.222222 | 220.888889 | 18 |
| First_Baseman | 74.000000 | 213.109091 | 55 |
| Outfielder | 73.010309 | 199.113402 | 194 |
| Relief_Pitcher | 74.374603 | 203.517460 | 315 |
| Second_Baseman | 71.362069 | 184.344828 | 58 |
| Shortstop | 71.903846 | 182.923077 | 52 |
| Starting_Pitcher | 74.719457 | 205.163636 | 221 |
| Third_Baseman | 73.044444 | 200.955556 | 45 |

We can notice that the mean heights of first basemen is higher than that of second basemen. Thus, we may be tempted to conclude that **first basemen are higher than second basemen**.

> This statement is called **a hypothesis**, because we do not know whether the fact is actually true or not.

However, it is not always obvious whether we can make this conclusion. From the discussion above we know that each mean has an associated confidence interval, and thus this difference can just be a statistical error. We need some more formal way to test our hypothesis.

Let''s compute confidence intervals separately for heights of first and second basemen:

| Confidence | First Basemen | Second Basemen |
|------------|---------------|----------------|
| 0.85 | 73.62..74.38 | 71.04..71.69 |
| 0.90 | 73.56..74.44 | 70.99..71.73 |
| 0.95 | 73.47..74.53 | 70.92..71.81 |

We can see that under no confidence the intervals overlap. That proves our hypothesis that first basemen are higher than second basemen.

More formally, the problem we are solving is to see if **two probability distributions are the same**, or at least have the same parameters. Depending on the distribution, we need to use different tests for that. If we know that our distributions are normal, we can apply **Student t-test (https://en.wikipedia.org/wiki/Student%27s_t-test)**. 

In Student t-test, we compute so-called **t-value**, which indicates the difference between means, taking into account the variance. It is demonstrated that t-value follows **student distribution**, which allows us to get the threshold value for a given confidence level **p** (this can be computed, or looked up in the numerical tables). We then compare t-value to this threshold to approve or reject the hypothesis.

In Python, we can use the **SciPy** package, which includes `ttest_ind` function (in addition to many other useful statistical functions!). It computes the t-value for us, and also does the reverse lookup of confidence p-value, so that we can just look at the confidence to draw the conclusion.

For example, our comparison between heights of first and second basemen give us the following results: 
```python
from scipy.stats import ttest_ind

tval, pval = ttest_ind(df.loc[df[''Role'']==''First_Baseman'',[''Height'']], df.loc[df[''Role'']==''Designated_Hitter'',[''Height'']],equal_var=False)
print(f"T-value = {tval[0]:.2f}\nP-value: {pval[0]}")
```
```
T-value = 7.65
P-value: 9.137321189738925e-12
```
In our case, p-value is very low, meaning that there is strong evidence supporting that first basemen are taller.

There are also different other types of hypothesis that we might want to test, for example:
* To prove that a given sample follows some distribution. In our case we have assumed that heights are normally distributed, but that needs formal statistical verification. 
* To prove that a mean value of a sample corresponds to some predefined value
* To compare means of a number of samples (eg. what is the difference in happiness levels among different age groups)

## Law of Large Numbers and Central Limit Theorem

One of the reasons why normal distribution is so important is so-called **central limit theorem**. Suppose we have a large sample of independent N values X1, ..., XN, sampled from any distribution with mean &mu; and variance &sigma;2. Then, for sufficiently large N (in other words, when N&rarr;&infin;), the mean &Sigma;iXi would be normally distributed, with mean &mu; and variance &sigma;2/N.

> Another way to interpret the central limit theorem is to say that regardless of distribution, when you compute the mean of a sum of any random variable values you end up with normal distribution. 

From the central limit theorem it also follows that, when N&rarr;&infin;, the probability of the sample mean to be equal to &mu; becomes 1. This is known as **the law of large numbers**.

## Covariance and Correlation

One of the things Data Science does is finding relations between data. We say that two sequences **correlate** when they exhibit the similar behavior at the same time, i.e. they either rise/fall simultaneously, or one sequence rises when another one falls and vice versa. In other words, there seems to be some relation between two sequences.

> Correlation does not necessarily indicate causal relationship between two sequences; sometimes both variables can depend on some external cause, or it can be purely by chance the two sequences correlate. However, strong mathematical correlation is a good indication that two variables are somehow connected.

 Mathematically, the main concept that shows the relation between two random variables is **covariance**, that is computed like this: Cov(X,Y) = **E**\[(X-**E**(X))(Y-**E**(Y))\]. We compute the deviation of both variables from their mean values, and then product of those deviations. If both variables deviate together, the product would always be a positive value, that would add up to positive covariance. If both variables deviate out-of-sync (i.e. one falls below average when another one rises above average), we will always get negative numbers, that will add up to negative covariance. If the deviations are not dependent, they will add up to roughly zero.

The absolute value of covariance does not tell us much on how large the correlation is, because it depends on the magnitude of actual values. To normalize it, we can divide covariance by standard deviation of both variables, to get **correlation**. The good thing is that correlation is always in the range of [-1,1], where 1 indicates strong positive correlation between values, -1 - strong negative correlation, and 0 - no correlation at all (variables are independent). 

**Example**: We can compute correlation between weights and heights of baseball players from the dataset mentioned above:
```python
print(np.corrcoef(weights,heights))
```
As a result, we get **correlation matrix** like this one:
```
array([[1.        , 0.52959196],
       [0.52959196, 1.        ]])
```

> Correlation matrix C can be computed for any number of input sequences S1, ..., Sn. The value of Cij is the correlation between Si and Sj, and diagonal elements are always 1 (which is also self-correlation of Si).

In our case, the value 0.53 indicates that there is some correlation between weight and height of a person. We can also make the scatter plot of one value against the other to see the relationship visually:



> More examples of correlation and covariance can be found in accompanying notebook (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/04-stats-and-probability/notebook.ipynb).

## Conclusion

In this section, we have learnt:

* basic statistical properties of data, such as mean, variance, mode and quartiles
* different distributions of random variables, including normal distribution
* how to find correlation between different properties
* how to use sound apparatus of math and statistics in order to prove some hypotheses, 
* how to compute confidence intervals for random variable given data sample

While this is definitely not exhaustive list of topics that exist within probability and statistics, it should be enough to give you a good start into this course.

## 🚀 Challenge

Use the sample code in the notebook to test other hypothesis that: 
1. First basemen are older than second basemen
2. First basemen are taller than third basemen
3. Shortstops are taller than second basemen

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/7)

## Review & Self Study

Probability and statistics is such a broad topic that it deserves its own course. If you are interested to go deeper into theory, you may want to continue reading some of the following books:

1. Carlos Fernandez-Granda (https://cims.nyu.edu/~cfgranda/) from New York University has great lecture notes Probability and Statistics for Data Science (https://cims.nyu.edu/~cfgranda/pages/stuff/probability_stats_for_DS.pdf) (available online)
1. Peter and Andrew Bruce. Practical Statistics for Data Scientists. (https://www.oreilly.com/library/view/practical-statistics-for/9781491952955/) [sample code in R (https://github.com/andrewgbruce/statistics-for-data-scientists)]. 
1. James D. Miller. Statistics for Data Science (https://www.packtpub.com/product/statistics-for-data-science/9781788290678) [sample code in R (https://github.com/PacktPublishing/Statistics-for-Data-Science)]

## Assignment

Small Diabetes Study (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/1-Introduction/04-stats-and-probability/assignment.md)

## Credits

This lesson has been authored with ♥️ by Dmitry Soshnikov (http://soshnikov.com/)',18);
update public.books set status='APPROVED',published_at=now() where id=b;end if;
if not exists(select 1 from public.books where slug='working-with-data') then
insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values('working-with-data','Working with Data','Microsoft and curriculum contributors','A chapter-based reading guide adapted from the openly licensed Data-Science-For-Beginners curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.','Databases','English','https://github.com/microsoft/Data-Science-For-Beginners/tree/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f','MIT','https://github.com/microsoft/Data-Science-For-Beginners/blob/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/LICENSE','    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
','Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained. This is a reading adaptation, not a complete standalone edition.','https://github.com/microsoft/Data-Science-For-Beginners/blob/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/LICENSE','Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.',true,true,41) returning id into b;
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'working-with-data-1','Working with Data: Relational Databases',1,'# Working with Data: Relational Databases

| ](../../sketchnotes/05-RelationalData.png)|
|:---:|
| Working With Data: Relational Databases - _Sketchnote by @nitya (https://twitter.com/nitya)_ |

Chances are you have used a spreadsheet in the past to store information. You had a set of rows and columns, where the rows contained the information (or data), and the columns described the information (sometimes called metadata). A relational database is built upon this core principle of columns and rows in tables, allowing you to have information spread across multiple tables. This allows you to work with more complex data, avoid duplication, and have flexibility in the way you explore the data. Let''s explore the concepts of a relational database.

## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/8)

## It all starts with tables

A relational database has at its core tables. Just as with the spreadsheet, a table is a collection of columns and rows. The row contains the data or information we wish to work with, such as the name of a city or the amount of rainfall. The columns describe the data they store.

Let''s begin our exploration by starting a table to store information about cities. We might start with their name and country. You could store this in a table as follows:

| City     | Country       |
| -------- | ------------- |
| Tokyo    | Japan         |
| Atlanta  | United States |
| Auckland | New Zealand   |

Notice the column names of **city**, **country** and **population** describe the data being stored, and each row has information about one city.

## The shortcomings of a single table approach

Chances are, the table above seems relatively familiar to you. Let''s start to add some additional data to our burgeoning database - annual rainfall (in millimeters). We''ll focus on the years 2018, 2019 and 2020. If we were to add it for Tokyo, it might look something like this:

| City  | Country | Year | Amount |
| ----- | ------- | ---- | ------ |
| Tokyo | Japan   | 2020 | 1690   |
| Tokyo | Japan   | 2019 | 1874   |
| Tokyo | Japan   | 2018 | 1445   |

What do you notice about our table? You might notice we''re duplicating the name and country of the city over and over. That could take up quite a bit of storage, and is largely unnecessary to have multiple copies of. After all, Tokyo has just the one name we''re interested in.

OK, let''s try something else. Let''s add new columns for each year:

| City     | Country       | 2018 | 2019 | 2020 |
| -------- | ------------- | ---- | ---- | ---- |
| Tokyo    | Japan         | 1445 | 1874 | 1690 |
| Atlanta  | United States | 1779 | 1111 | 1683 |
| Auckland | New Zealand   | 1386 | 942  | 1176 |

While this avoids the row duplication, it adds a couple of other challenges. We would need to modify the structure of our table each time there''s a new year. Additionally, as our data grows having our years as columns will make it trickier to retrieve and calculate values.

This is why we need multiple tables and relationships. By breaking apart our data we can avoid duplication and have more flexibility in how we work with our data.

## The concepts of relationships

Let''s return to our data and determine how we want to split things up. We know we want to store the name and country for our cities, so this will probably work best in one table.

| City     | Country       |
| -------- | ------------- |
| Tokyo    | Japan         |
| Atlanta  | United States |
| Auckland | New Zealand   |

But before we create the next table, we need to figure out how to reference each city. We need some form of an identifier, ID or (in technical database terms) a primary key. A primary key is a value used to identify one specific row in a table. While this could be based on a value itself (we could use the name of the city, for example), it should almost always be a number or other identifier. We don''t want the id to ever change as it would break the relationship. You will find in most cases the primary key or id will be an auto-generated number.

> ✅ Primary key is frequently abbreviated as PK

### cities

| city_id | City     | Country       |
| ------- | -------- | ------------- |
| 1       | Tokyo    | Japan         |
| 2       | Atlanta  | United States |
| 3       | Auckland | New Zealand   |

> ✅ You will notice we use the terms "id" and "primary key" interchangeably during this lesson. The concepts here apply to DataFrames, which you will explore later. DataFrames don''t use the terminology of "primary key", however you will notice they behave much in the same way.

With our cities table created, let''s store the rainfall. Rather than duplicating the full information about the city, we can use the id. We should also ensure the newly created table has an *id* column as well, as all tables should have an id or primary key.

### rainfall

| rainfall_id | city_id | Year | Amount |
| ----------- | ------- | ---- | ------ |
| 1           | 1       | 2018 | 1445   |
| 2           | 1       | 2019 | 1874   |
| 3           | 1       | 2020 | 1690   |
| 4           | 2       | 2018 | 1779   |
| 5           | 2       | 2019 | 1111   |
| 6           | 2       | 2020 | 1683   |
| 7           | 3       | 2018 | 1386   |
| 8           | 3       | 2019 | 942    |
| 9           | 3       | 2020 | 1176   |

Notice the **city_id** column inside the newly created **rainfall** table. This column contains values which reference the IDs in the **cities** table. In technical relational data terms, this is called a **foreign key**; it''s a primary key from another table. You can just think of it as a reference or a pointer. **city_id** 1 references Tokyo.

> [!NOTE] 
> Foreign key is frequently abbreviated as FK

## Retrieving the data

With our data separated into two tables, you may be wondering how we retrieve it. If we are using a relational database such as MySQL, SQL Server or Oracle, we can use a language called Structured Query Language or SQL. SQL (sometimes pronounced sequel) is a standard language used to retrieve and modify data in a relational database.

To retrieve data you use the command `SELECT`. At its core, you **select** the columns you want to see **from** the table they''re contained in. If you wanted to display just the names of the cities, you could use the following:

```sql
SELECT city
FROM cities;

-- Output:
-- Tokyo
-- Atlanta
-- Auckland
```

`SELECT` is where you list the columns, and `FROM` is where you list the tables.

> [!NOTE] 
> SQL syntax is case-insensitive, meaning `select` and `SELECT` mean the same thing. However, depending on the type of database you are using the columns and tables might be case sensitive. As a result, it''s a best practice to always treat everything in programming like it''s case sensitive. When writing SQL queries common convention is to put the keywords in all upper-case letters.

The query above will display all cities. Let''s imagine we only wanted to display cities in New Zealand. We need some form of a filter. The SQL keyword for this is `WHERE`, or "where something is true".

```sql
SELECT city
FROM cities
WHERE country = ''New Zealand'';

-- Output:
-- Auckland
```

## Joining data

Until now we''ve retrieved data from a single table. Now we want to bring the data together from both **cities** and **rainfall**. This is done by *joining* them together. You will effectively create a seam between the two tables, and match up the values from a column from each table.

In our example, we will match the **city_id** column in **rainfall** with the **city_id** column in **cities**. This will match the rainfall value with its respective city. The type of join we will perform is what''s called an *inner* join, meaning if any rows don''t match with anything from the other table they won''t be displayed. In our case every city has rainfall, so everything will be displayed.

Let''s retrieve the rainfall for 2019 for all our cities.

We''re going to do this in steps. The first step is to join the data together by indicating the columns for the seam - **city_id** as highlighted before.

```sql
SELECT cities.city
    rainfall.amount
FROM cities
    INNER JOIN rainfall ON cities.city_id = rainfall.city_id
```

We have highlighted the two columns we want, and the fact we want to join the tables together by the **city_id**. Now we can add the `WHERE` statement to filter out only year 2019.

```sql
SELECT cities.city
    rainfall.amount
FROM cities
    INNER JOIN rainfall ON cities.city_id = rainfall.city_id
WHERE rainfall.year = 2019

-- Output

-- city     | amount
-- -------- | ------
-- Tokyo    | 1874
-- Atlanta  | 1111
-- Auckland |  942
```

## Summary

Relational databases are centered around dividing information between multiple tables which is then brought back together for display and analysis. This provides a high degree of flexibility to perform calculations and otherwise manipulate data. You have seen the core concepts of a relational database, and how to perform a join between two tables.

## 🚀 Challenge

There are numerous relational databases available on the internet. You can explore the data by using the skills you''ve learned above.

## Post-Lecture Quiz

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/9)

## Review & Self Study

There are several resources available on Microsoft Learn (https://docs.microsoft.com/learn?WT.mc_id=academic-77958-bethanycheum) for you to continue your exploration of SQL and relational database concepts

- Describe concepts of relational data (https://docs.microsoft.com//learn/modules/describe-concepts-of-relational-data?WT.mc_id=academic-77958-bethanycheum)
- Get Started Querying with Transact-SQL (https://docs.microsoft.com//learn/paths/get-started-querying-with-transact-sql?WT.mc_id=academic-77958-bethanycheum) (Transact-SQL is a version of SQL)
- SQL content on Microsoft Learn (https://docs.microsoft.com/learn/browse/?products=azure-sql-database%2Csql-server&expanded=azure&WT.mc_id=academic-77958-bethanycheum)

## Assignment

Displaying airport data (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/05-relational-databases/assignment.md)',9);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'working-with-data-2','Working with Data: Non-Relational Data',2,'# Working with Data: Non-Relational Data

| ](../../sketchnotes/06-NoSQL.png)|
|:---:|
|Working with NoSQL Data - _Sketchnote by @nitya (https://twitter.com/nitya)_ |

## Pre-Lecture Quiz (https://ff-quizzes.netlify.app/en/ds/quiz/10)

Data is not limited to relational databases. This lesson focuses on non-relational data and will cover the basics of spreadsheets and NoSQL.

## Spreadsheets

Spreadsheets are a popular way to store and explore data because it requires less work to setup and get started. In this lesson you''ll learn the basic components of a spreadsheet, as well as formulas and functions. The examples will be illustrated with Microsoft Excel, but most of the parts and topics will have similar names and steps in comparison to other spreadsheet software. 



A spreadsheet is a file and will be accessible in the file system of a computer, device, or cloud based file system. The software itself may be browser based or an application that must be installed on a computer or downloaded as an app. In Excel these files are also defined as **workbooks** and this terminology will be used the remainder of this lesson.

A workbook contains one or more **worksheets**, where each worksheet are labeled by tabs. Within a worksheet are rectangles called **cells**, which will contain the actual data. A cell is the intersection of a row and column, where the columns are labeled with alphabetical characters and rows labeled numerically. Some spreadsheets will contain headers in the first few rows to describe the data in a cell.

With these basic elements of an Excel workbook, we''ll use and an example from Microsoft Templates (https://templates.office.com/) focused on an inventory to walk through some additional parts of a spreadsheet. 

### Managing an Inventory 

The spreadsheet file named "InventoryExample" is a formatted spreadsheet of items within an inventory that contains three worksheets, where the tabs are labeled "Inventory List", "Inventory Pick List" and "Bin Lookup". Row 4 of the Inventory List worksheet is the header, which describes the value of each cell in the header column.



There are instances where a cell is dependent on the values of other cells to generate its value. The Inventory List spreadsheet keeps track of the cost of every item in its inventory, but what if we need to know the value of everything in the inventory? **Formulas** (https://support.microsoft.com/en-us/office/overview-of-formulas-34519a4e-1e8d-4f4b-84d4-d642c4f63263) perform actions on cell data and is used to calculate the cost of the inventory in this example. This spreadsheet used a formula in the Inventory Value column to calculate the value of each item by multiplying the quantity under the QTY header and its costs by the cells under the COST header. Double clicking or highlighting a cell will show the formula. You''ll notice that formulas start with an equals sign, followed by the calculation or operation. 



We can use another formula to add all the values of Inventory Value together to get its total value. This could be calculated by adding each cell to generate the sum, but that can be a tedious task. Excel has **functions** (https://support.microsoft.com/en-us/office/sum-function-043e1c7d-7726-4e80-8f32-07b23e057f89), or predefined formulas to perform calculations on cell values. Functions require arguments, which are the required values used to perform these calculations. When functions require more than one argument, they will need to be listed in a particular order or the function may not calculate the correct value. This example uses the SUM function, and uses the values of on Inventory Value as the argument to add generate the total listed under row 3, column B (also referred to as B3).

## NoSQL

NoSQL is an umbrella term for the different ways to store non-relational data and can be interpreted as "non-SQL", "non-relational" or  "not only SQL". These type of database systems can be categorized into 4 types.


> Source from Michał Białecki Blog (https://www.michalbialecki.com/2018/03/18/azure-cosmos-db-key-value-database-cloud/)

Key-value (https://docs.microsoft.com/en-us/azure/architecture/data-guide/big-data/non-relational-data#keyvalue-data-stores) databases pair unique keys, which are a unique identifier associated with a value. These pairs are stored using a hash table (https://www.hackerearth.com/practice/data-structures/hash-tables/basics-of-hash-tables/tutorial/) with an appropriate hashing function.



> Source from Microsoft (https://docs.microsoft.com/en-us/azure/cosmos-db/graph/graph-introduction#graph-database-by-example)

Graph (https://docs.microsoft.com/en-us/azure/architecture/data-guide/big-data/non-relational-data#graph-data-stores) databases describe relationships in data and are represented as a collection of nodes and edges. A node represents an entity, something that exists in the real world such as a student or bank statement. Edges represent the relationship between two entities  Each node and edge have properties that provides additional information about each node and edges.



Columnar (https://docs.microsoft.com/en-us/azure/architecture/data-guide/big-data/non-relational-data#columnar-data-stores) data stores organizes data into columns and rows like a relational data structure but each column is divided into groups called a column family, where all the data under one column is related and can be retrieved and changed in one unit. 


### Document Data Stores with the Azure Cosmos DB 

Document (https://docs.microsoft.com/en-us/azure/architecture/data-guide/big-data/non-relational-data#document-data-stores) data stores build on the concept of a key-value data store and is made up of a series of fields and objects. This section will explore document databases with the Cosmos DB emulator. 

A Cosmos DB database fits the definition of "Not Only SQL", where Cosmos DB''s document database relies on SQL to query the data. The previous lesson (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/05-relational-databases/README.md) on SQL covers the basics of the language, and we''ll be able to apply some of the same queries to a document database here. We''ll be using the Cosmos DB Emulator, which allows us to create and explore a document database locally on a computer. Read more about the Emulator here (https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator?tabs=ssl-netstd21).

A document is a collection of fields and object values, where the fields describe what the object value represents. Below is an example of a document.

```json
{
    "firstname": "Eva",
    "age": 44,
    "id": "8c74a315-aebf-4a16-bb38-2430a9896ce5",
    "_rid": "bHwDAPQz8s0BAAAAAAAAAA==",
    "_self": "dbs/bHwDAA==/colls/bHwDAPQz8s0=/docs/bHwDAPQz8s0BAAAAAAAAAA==/",
    "_etag": "\"00000000-0000-0000-9f95-010a691e01d7\"",
    "_attachments": "attachments/",
    "_ts": 1630544034
}
```

The fields of interest in this document are: `firstname`, `id`, and `age`. The rest of the fields with the underscores were generated by Cosmos DB.

#### Exploring Data with the Cosmos DB Emulator

You can download and install the emulator for Windows here (https://aka.ms/cosmosdb-emulator). Refer to this documentation (https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator?tabs=ssl-netstd21#run-on-linux-macos) for options on how to run the Emulator for macOS and Linux.

The Emulator launches a browser window, where the Explorer view allows you to explore documents.



If you''re following along, click on "Start with Sample" to generate a sample database called SampleDB. If you expand Sample DB by clicking on the arrow you''ll find a container called `Persons`, a container holds a collection of items, which are the documents within the container. You can explore the four individual documents under `Items`. 



#### Querying Document Data with the Cosmos DB Emulator

We can also query the sample data by clicking on the new SQL Query button (second button from the left).

`SELECT * FROM c` returns all the documents in the container. Let''s add a where clause and find everyone younger than 40.

`SELECT * FROM c where c.age < 40`

 

The query returns two documents, notice the age value for each document is less than 40.

#### JSON and Documents

If you''re familiar with JavaScript Object Notation (JSON) you''ll notice that documents look similar to JSON. There is a `PersonsData.json` file in this directory with more data that you may upload to the Persons container in the Emulator via the `Upload Item` button.

In most instances, APIs that return JSON data can be directly transferred and stored in document databases. Below is another document, it represents tweets from the Microsoft Twitter account that was retrieved using the Twitter API, then inserted into Cosmos DB.

```json
{
    "created_at": "2021-08-31T19:03:01.000Z",
    "id": "1432780985872142341",
    "text": "Blank slate. Like this tweet if you’ve ever painted in Microsoft Paint before. https://t.co/cFeEs8eOPK",
    "_rid": "dhAmAIUsA4oHAAAAAAAAAA==",
    "_self": "dbs/dhAmAA==/colls/dhAmAIUsA4o=/docs/dhAmAIUsA4oHAAAAAAAAAA==/",
    "_etag": "\"00000000-0000-0000-9f84-a0958ad901d7\"",
    "_attachments": "attachments/",
    "_ts": 1630537000
```

The fields of interest in this document are: `created_at`, `id`, and `text`.

## 🚀 Challenge


There is a `TwitterData.json` file that you can upload to the SampleDB database. It''s recommended that you add it to a separate container. This can be done by:

1. Clicking the new container button in the top right
1. Selecting the existing database (SampleDB) creating a container id for the container
1. Setting the partition key to `/id`
1. Clicking OK (you can ignore rest of the information in this view as this is a small dataset running locally on your machine)
1. Open your new container and upload the Twitter Data file with `Upload Item` button

Try to run a few select queries to find the documents that have Microsoft in the text field. Hint: try to use the LIKE keyword (https://docs.microsoft.com/en-us/azure/cosmos-db/sql/sql-query-keywords#using-like-with-the--wildcard-character)

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/11)



## Review & Self Study

- There are some additional formatting and features added to this spreadsheet that this lesson does not cover. Microsoft has a large library of documentation and videos (https://support.microsoft.com/excel) on Excel if you''re interested in learning more.

- This architectural documentation details the characteristics in the different types of non-relational data: Non-relational Data and NoSQL (https://docs.microsoft.com/en-us/azure/architecture/data-guide/big-data/non-relational-data)

- Cosmos DB is a cloud based non-relational database that can also store the different NoSQL types mentioned in this lesson. Learn more about these types in this Cosmos DB Microsoft Learn Module (https://docs.microsoft.com/en-us/learn/paths/work-with-nosql-data-in-azure-cosmos-db/)

## Assignment

Soda Profits (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/06-non-relational/assignment.md)',8);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'working-with-data-3','Working with Data: Python and the Pandas Library',3,'# Working with Data: Python and the Pandas Library

|  ](../../sketchnotes/07-WorkWithPython.png) |
| :-------------------------------------------------------------------------------------------------------: |
|                 Working With Python - _Sketchnote by @nitya (https://twitter.com/nitya)_                 |

[](https://youtu.be/dZjWOGbsN4Y)

While databases offer very efficient ways to store data and query them using query languages, the most flexible way of data processing is writing your own program to manipulate data. In many cases, doing a database query would be a more effective way. However in some cases when more complex data processing is needed, it cannot be done easily using SQL. 
Data processing can be programmed in any programming language, but there are certain languages that are higher level with respect to working with data. Data scientists typically prefer one of the following languages:

* **Python (https://www.python.org/)**, a general-purpose programming language, which is often considered one of the best options for beginners due to its simplicity. Python has a lot of additional libraries that can help you solve many practical problems, such as extracting your data from ZIP archive, or converting picture to grayscale. In addition to data science, Python is also often used for web development. 
* **R (https://www.r-project.org/)** is a traditional toolbox developed with statistical data processing in mind. It also contains large repository of libraries (CRAN), making it a good choice for data processing. However, R is not a general-purpose programming language, and is rarely used outside of data science domain.
* **Julia (https://julialang.org/)** is another language developed specifically for data science. It is intended to give better performance than Python, making it a great tool for scientific experimentation.

In this lesson, we will focus on using Python for simple data processing. We will assume basic familiarity with the language. If you want a deeper tour of Python, you can refer to one of the following resources:

* Learn Python in a Fun Way with Turtle Graphics and Fractals (https://github.com/shwars/pycourse) - GitHub-based quick intro course into Python Programming
* Take your First Steps with Python (https://docs.microsoft.com/en-us/learn/paths/python-first-steps/?WT.mc_id=academic-77958-bethanycheum) Learning Path on Microsoft Learn (http://learn.microsoft.com/?WT.mc_id=academic-77958-bethanycheum)

Data can come in many forms. In this lesson, we will consider three forms of data - **tabular data**, **text** and **images**.

We will focus on a few examples of data processing, instead of giving you full overview of all related libraries. This would allow you to get the main idea of what''s possible, and leave you with understanding on where to find solutions to your problems when you need them.

> **Most useful advice**. When you need to perform certain operation on data that you do not know how to do, try searching for it in the internet. Stackoverflow (https://stackoverflow.com/) usually contains a lot of useful code sample in Python for many typical tasks. 



## Pre-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/12)

## Tabular Data and Dataframes

You have already met tabular data when we talked about relational databases. When you have a lot of data, and it is contained in many different linked tables, it definitely makes sense to use SQL for working with it. However, there are many cases when we have a table of data, and we need to gain some **understanding** or **insights** about this data, such as the distribution, correlation between values, etc. In data science, there are a lot of cases when we need to perform some transformations of the original data, followed by visualization. Both those steps can be easily done using Python.

There are two most useful libraries in Python that can help you deal with tabular data:
* **Pandas (https://pandas.pydata.org/)** allows you to manipulate so-called **Dataframes**, which are analogous to relational tables. You can have named columns, and perform different operations on row, columns and dataframes in general. 
* **Numpy (https://numpy.org/)** is a library for working with **tensors**, i.e. multi-dimensional **arrays**. Array has values of the same underlying type, and it is simpler than dataframe, but it offers more mathematical operations, and creates less overhead.

There are also a couple of other libraries you should know about:
* **Matplotlib (https://matplotlib.org/)** is a library used for data visualization and plotting graphs
* **SciPy (https://www.scipy.org/)** is a library with some additional scientific functions. We have already come across this library when talking about probability and statistics

Here is a piece of code that you would typically use to import those libraries in the beginning of your Python program:
```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import ... # you need to specify exact sub-packages that you need
``` 

Pandas is centered around a few basic concepts.

### Series 

**Series** is a sequence of values, similar to a list or numpy array. The main difference is that series also has an **index**, and when we operate on series (eg., add them), the index is taken into account. Index can be as simple as integer row number (it is the index used by default when creating a series from list or array), or it can have a complex structure, such as date interval.

> **Note**: There is some introductory Pandas code in the accompanying notebook `notebook.ipynb` (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/07-python/notebook.ipynb). We only outline some the examples here, and you are definitely welcome to check out the full notebook.

Consider an example: we want to analyze sales of our ice-cream spot. Let''s generate a series of sales numbers (number of items sold each day) for some time period:

```python
start_date = "Jan 1, 2020"
end_date = "Mar 31, 2020"
idx = pd.date_range(start_date,end_date)
print(f"Length of index is {len(idx)}")
items_sold = pd.Series(np.random.randint(25,50,size=len(idx)),index=idx)
items_sold.plot()
```


Now suppose that each week we are organizing a party for friends, and we take additional 10 packs of ice-cream for a party. We can create another series, indexed by week, to demonstrate that:
```python
additional_items = pd.Series(10,index=pd.date_range(start_date,end_date,freq="W"))
```
When we add two series together, we get total number:
```python
total_items = items_sold.add(additional_items,fill_value=0)
total_items.plot()
```


> **Note** that we are not using simple syntax `total_items+additional_items`. If we did, we would have received a lot of `NaN` (*Not a Number*) values in the resulting series. This is because there are missing values for some of the index point in the `additional_items` series, and adding `Nan` to anything results in `NaN`. Thus we need to specify `fill_value` parameter during addition.

With time series, we can also **resample** the series with different time intervals. For example, suppose we want to compute mean sales volume monthly. We can use the following code:
```python
monthly = total_items.resample("1M").mean()
ax = monthly.plot(kind=''bar'')
```


### DataFrame

A DataFrame is essentially a collection of series with the same index. We can combine several series together into a DataFrame:
```python
a = pd.Series(range(1,10))
b = pd.Series(["I","like","to","play","games","and","will","not","change"],index=range(0,9))
df = pd.DataFrame([a,b])
```
This will create a horizontal table like this:
|     | 0   | 1    | 2   | 3   | 4      | 5   | 6      | 7    | 8    |
| --- | --- | ---- | --- | --- | ------ | --- | ------ | ---- | ---- |
| 0   | 1   | 2    | 3   | 4   | 5      | 6   | 7      | 8    | 9    |
| 1   | I   | like | to  | use | Python | and | Pandas | very | much |

We can also use Series as columns, and specify column names using dictionary:
```python
df = pd.DataFrame({ ''A'' : a, ''B'' : b })
```
This will give us a table like this:

|     | A   | B      |
| --- | --- | ------ |
| 0   | 1   | I      |
| 1   | 2   | like   |
| 2   | 3   | to     |
| 3   | 4   | use    |
| 4   | 5   | Python |
| 5   | 6   | and    |
| 6   | 7   | Pandas |
| 7   | 8   | very   |
| 8   | 9   | much   |

**Note** that we can also get this table layout by transposing the previous table, eg. by writing 
```python
df = pd.DataFrame([a,b]).T.rename(columns={ 0 : ''A'', 1 : ''B'' })
```
Here `.T` means the operation of transposing the DataFrame, i.e. changing rows and columns, and `rename` operation allows us to rename columns to match the previous example.

Here are a few most important operations we can perform on DataFrames:

**Column selection**. We can select individual columns by writing `df[''A'']` - this operation returns a Series. We can also select a subset of columns into another DataFrame by writing `df[[''B'',''A'']]` - this return another DataFrame.

**Filtering** only certain rows by criteria. For example, to leave only rows with column `A` greater than 5, we can write `df[df[''A'']>5]`.

> **Note**: The way filtering works is the following. The expression `df[''A'']5 and df[''A'']5) & (df[''A''] df[''ADescr''] = "Low" if df[''A'']  If you do not know how to run code in Jupyter Notebook, have a look at this article (https://soshnikov.com/education/how-to-execute-notebooks-from-github/).

## Working with Unstructured Data

While data very often comes in tabular form, in some cases we need to deal with less structured data, for example, text or images. In this case, to apply data processing techniques we have seen above, we need to somehow **extract** structured data. Here are a few examples:

* Extracting keywords from text, and seeing how often those keywords appear
* Using neural networks to extract information about objects on the picture
* Getting information on emotions of people on video camera feed

## 🚀 Challenge 2: Analyzing COVID Papers

In this challenge, we will continue with the topic of COVID pandemic, and focus on processing scientific papers on the subject. There is CORD-19 Dataset (https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge) with more than 7000 (at the time of writing) papers on COVID, available with metadata and abstracts (and for about half of them there is also full text provided).

A full example of analyzing this dataset using Text Analytics for Health (https://docs.microsoft.com/azure/cognitive-services/text-analytics/how-tos/text-analytics-for-health/?WT.mc_id=academic-77958-bethanycheum) cognitive service is described in this blog post (https://soshnikov.com/science/analyzing-medical-papers-with-azure-and-text-analytics-for-health/). We will discuss simplified version of this analysis.

> **NOTE**: We do not provide a copy of the dataset as part of this repository. You may first need to download the `metadata.csv` (https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge?select=metadata.csv) file from this dataset on Kaggle (https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge). Registration with Kaggle may be required. You may also download the dataset without registration from here (https://ai2-semanticscholar-cord-19.s3-us-west-2.amazonaws.com/historical_releases.html), but it will include all full texts in addition to metadata file.

Open `notebook-papers.ipynb` (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/07-python/notebook-papers.ipynb) and read it from top to bottom. You can also execute cells, and do some challenges that we have left for you at the end.



## Processing Image Data

Recently, very powerful AI models have been developed that allow us to understand images. There are many tasks that can be solved using pre-trained neural networks, or cloud services. Some examples include:

* **Image Classification**, which can help you categorize the image into one of the pre-defined classes. You can easily train your own image classifiers using services such as Custom Vision (https://azure.microsoft.com/services/cognitive-services/custom-vision-service/?WT.mc_id=academic-77958-bethanycheum)
* **Object Detection** to detect different objects in the image. Services such as computer vision (https://azure.microsoft.com/services/cognitive-services/computer-vision/?WT.mc_id=academic-77958-bethanycheum) can detect a number of common objects, and you can train Custom Vision (https://azure.microsoft.com/services/cognitive-services/custom-vision-service/?WT.mc_id=academic-77958-bethanycheum) model to detect some specific objects of interest.
* **Face Detection**, including Age, Gender and Emotion detection. This can be done via Face API (https://azure.microsoft.com/services/cognitive-services/face/?WT.mc_id=academic-77958-bethanycheum).

All those cloud services can be called using Python SDKs (https://docs.microsoft.com/samples/azure-samples/cognitive-services-python-sdk-samples/cognitive-services-python-sdk-samples/?WT.mc_id=academic-77958-bethanycheum), and thus can be easily incorporated into your data exploration workflow. 

Here are some examples of exploring data from Image data sources:
* In the blog post How to Learn Data Science without Coding (https://soshnikov.com/azure/how-to-learn-data-science-without-coding/) we explore Instagram photos, trying to understand what makes people give more likes to a photo. We first extract as much information from pictures as possible using computer vision (https://azure.microsoft.com/services/cognitive-services/computer-vision/?WT.mc_id=academic-77958-bethanycheum), and then use Azure Machine Learning AutoML (https://docs.microsoft.com/azure/machine-learning/concept-automated-ml/?WT.mc_id=academic-77958-bethanycheum) to build interpretable model.
* In Facial Studies Workshop (https://github.com/CloudAdvocacy/FaceStudies) we use Face API (https://azure.microsoft.com/services/cognitive-services/face/?WT.mc_id=academic-77958-bethanycheum) to extract emotions on people on photographs from events, in order to try to understand what makes people happy. 

## Conclusion

Whether you already have structured or unstructured data, using Python you can perform all steps related to data processing and understanding. It is probably the most flexible way of data processing, and that is the reason the majority of data scientists use Python as their primary tool. Learning Python in depth is probably a good idea if you are serious about your data science journey!

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/13)

## Review & Self Study

**Books**
* Wes McKinney. Python for Data Analysis: Data Wrangling with Pandas, NumPy, and IPython (https://www.amazon.com/gp/product/1491957662)

**Online Resources**
* Official 10 minutes to Pandas (https://pandas.pydata.org/pandas-docs/stable/user_guide/10min.html) tutorial
* Documentation on Pandas Visualization (https://pandas.pydata.org/pandas-docs/stable/user_guide/visualization.html)

**Learning Python**
* Learn Python in a Fun Way with Turtle Graphics and Fractals (https://github.com/shwars/pycourse)
* Take your First Steps with Python (https://docs.microsoft.com/learn/paths/python-first-steps/?WT.mc_id=academic-77958-bethanycheum) Learning Path on Microsoft Learn (http://learn.microsoft.com/?WT.mc_id=academic-77958-bethanycheum)

## Assignment

Perform more detailed data study for the challenges above (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/07-python/assignment.md)

## Credits

This lesson has been authored with ♥️ by Dmitry Soshnikov (http://soshnikov.com/)',11);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'working-with-data-4','Working with Data: Data Preparation',4,'# Working with Data: Data Preparation

| ](../../sketchnotes/08-DataPreparation.png)|
|:---:|
|Data Preparation - _Sketchnote by @nitya (https://twitter.com/nitya)_ |

## Pre-Lecture Quiz (https://ff-quizzes.netlify.app/en/ds/quiz/14)



Depending on its source, raw data may contain some inconsistencies that will cause challenges in analysis and modeling. In other words, this data can be categorized as “dirty” and will need to be cleaned up. This lesson focuses on techniques for cleaning and transforming the data to handle challenges of missing, inaccurate, or incomplete data. Topics covered in this lesson will utilize Python and the Pandas library and will be demonstrated in the notebook (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/08-data-preparation/notebook.ipynb) within this directory.

## The importance of cleaning data

- **Ease of use and reuse**: When data is properly organized and normalized it’s easier to search, use, and share with others.

- **Consistency**: Data science often requires working with more than one dataset, where datasets from different sources need to be joined together. Making sure that each individual data set has common standardization will ensure that the data is still useful when they are all merged into one dataset.

- **Model accuracy**: Data that has been cleaned improves the accuracy of models that rely on it.

## Common cleaning goals and strategies

- **Exploring a dataset**: Data exploration, which is covered in a later lesson (https://github.com/microsoft/Data-Science-For-Beginners/tree/main/4-Data-Science-Lifecycle/15-analyzing) can help you discover data that needs to be cleaned up. Visually observing values within a dataset can set expectations of what that rest of it will look like, or provide an idea of the problems that can be resolved. Exploration can involve basic querying, visualizations, and sampling.

-  **Formatting**: Depending on the source, data can have inconsistencies in how it’s presented. This can cause problems in searching for and representing the value, where it’s seen within the dataset but is not properly represented in visualizations or query results. Common formatting problems involve resolving whitespace, dates, and data types. Resolving formatting issues is typically up to the people who are using the data. For example, standards on how dates and numbers are presented can differ by country. 

-  **Duplications**: Data that has more than one occurrence can produce inaccurate results and usually should be removed. This can be a common occurrence when joining two or more datasets together. However, there are instances where duplication in joined datasets contain pieces that can provide additional information and may need to be preserved.

- **Missing Data**: Missing data can cause inaccuracies as well as weak or biased results. Sometimes these can be resolved by a "reload" of the data, filling in the missing values with computation and code like Python, or simply just removing the value and corresponding data. There are numerous reasons for why data may be missing and the actions that are taken to resolve these missing values can be dependent on how and why they went missing in the first place. 

## Exploring DataFrame information
> **Learning goal:** By the end of this subsection, you should be comfortable finding general information about the data stored in pandas DataFrames.

Once you have loaded your data into pandas, it will more likely than not be in a DataFrame(refer to the previous lesson (https://github.com/microsoft/Data-Science-For-Beginners/tree/main/2-Working-With-Data/07-python#dataframe) for detailed overview). However, if the data set in your DataFrame has 60,000 rows and 400 columns, how do you even begin to get a sense of what you''re working with? Fortunately, pandas (https://pandas.pydata.org/) provides some convenient tools to quickly look at overall information about a DataFrame in addition to the first few and last few rows.

In order to explore this functionality, we will import the Python scikit-learn library and use an iconic dataset: the **Iris data set**.

```python
import pandas as pd
from sklearn.datasets import load_iris

iris = load_iris()
iris_df = pd.DataFrame(data=iris[''data''], columns=iris[''feature_names''])
```
|                                        |sepal length (cm)|sepal width (cm)|petal length (cm)|petal width (cm)|
|----------------------------------------|-----------------|----------------|-----------------|----------------|
|0                                       |5.1              |3.5             |1.4              |0.2             |
|1                                       |4.9              |3.0             |1.4              |0.2             |
|2                                       |4.7              |3.2             |1.3              |0.2             |
|3                                       |4.6              |3.1             |1.5              |0.2             |
|4                                       |5.0              |3.6             |1.4              |0.2             |

- **DataFrame.info**: To start off, the `info()` method is used to print a summary of the content present in a `DataFrame`. Let''s take a look at this dataset to see what we have:
```python
iris_df.info()
```
```
RangeIndex: 150 entries, 0 to 149
Data columns (total 4 columns):
 #   Column             Non-Null Count  Dtype  
---  ------             --------------  -----  
 0   sepal length (cm)  150 non-null    float64
 1   sepal width (cm)   150 non-null    float64
 2   petal length (cm)  150 non-null    float64
 3   petal width (cm)   150 non-null    float64
dtypes: float64(4)
memory usage: 4.8 KB
```
From this, we know that the *Iris* dataset has 150 entries in four columns with no null entries. All of the data is stored as 64-bit floating-point numbers.

- **DataFrame.head()**: Next, to check the actual content of the `DataFrame`, we use the `head()` method. Let''s see what the first few rows of our `iris_df` look like:
```python
iris_df.head()
```
```
   sepal length (cm)  sepal width (cm)  petal length (cm)  petal width (cm)
0                5.1               3.5                1.4               0.2
1                4.9               3.0                1.4               0.2
2                4.7               3.2                1.3               0.2
3                4.6               3.1                1.5               0.2
4                5.0               3.6                1.4               0.2
```
- **DataFrame.tail()**: Conversely, to check the last few rows of the `DataFrame`, we use the `tail()` method:
```python
iris_df.tail()
```
```
     sepal length (cm)  sepal width (cm)  petal length (cm)  petal width (cm)
145                6.7               3.0                5.2               2.3
146                6.3               2.5                5.0               1.9
147                6.5               3.0                5.2               2.0
148                6.2               3.4                5.4               2.3
149                5.9               3.0                5.1               1.8
```
> **Takeaway:** Even just by looking at the metadata about the information in a DataFrame or the first and last few values in one, you can get an immediate idea about the size, shape, and content of the data you are dealing with.

## Dealing with Missing Data
> **Learning goal:** By the end of this subsection, you should know how to replace or remove null values from DataFrames.

Most of the time the datasets you want to use (of have to use) have missing values in them. How missing data is handled carries with it subtle tradeoffs that can affect your final analysis and real-world outcomes.

Pandas handles missing values in two ways. The first you''ve seen before in previous sections: `NaN`, or Not a Number. This is a actually a special value that is part of the IEEE floating-point specification and it is only used to indicate missing floating-point values.

For missing values apart from floats, pandas uses the Python `None` object. While it might seem confusing that you will encounter two different kinds of values that say essentially the same thing, there are sound programmatic reasons for this design choice and, in practice, going this route enables pandas to deliver a good compromise for the vast majority of cases. Notwithstanding this, both `None` and `NaN` carry restrictions that you need to be mindful of with regards to how they can be used.

Check out more about `NaN` and `None` from the notebook (https://github.com/microsoft/Data-Science-For-Beginners/blob/main/4-Data-Science-Lifecycle/15-analyzing/notebook.ipynb)!

- **Detecting null values**: In `pandas`, the `isnull()` and `notnull()` methods are your primary methods for detecting null data. Both return Boolean masks over your data. We will be using `numpy` for `NaN` values:
```python
import numpy as np

example1 = pd.Series([0, np.nan, '''', None])
example1.isnull()
```
```
0    False
1     True
2    False
3     True
dtype: bool
```
Look closely at the output. Does any of it surprise you? While `0` is an arithmetic null, it''s nevertheless a perfectly good integer and pandas treats it as such. `''''` is a little more subtle. While we used it in Section 1 to represent an empty string value, it is nevertheless a string object and not a representation of null as far as pandas is concerned.

Now, let''s turn this around and use these methods in a manner more like you will use them in practice. You can use Boolean masks  directly as a ``Series`` or ``DataFrame`` index, which can be useful when trying to work with isolated missing (or present) values.

> **Takeaway**: Both the `isnull()` and `notnull()` methods produce similar results when you use them in `DataFrame`s: they show the results and the index of those results, which will help you enormously as you wrestle with your data.

- **Dropping null values**: Beyond identifying missing values, pandas provides a convenient means to remove null values from `Series` and `DataFrame`s. (Particularly on large data sets, it is often more advisable to simply remove missing [NA] values from your analysis than deal with them in other ways.) To see this in action, let''s return to `example1`:
```python
example1 = example1.dropna()
example1
```
```
0    0
2     
dtype: object
```
Note that this should look like your output from `example3[example3.notnull()]`. The difference here is that, rather than just indexing on the masked values, `dropna` has removed those missing values from the `Series` `example1`.

Because `DataFrame`s have two dimensions, they afford more options for dropping data.

```python
example2 = pd.DataFrame([[1,      np.nan, 7], 
                         [2,      5,      8], 
                         [np.nan, 6,      9]])
example2
```
|      | 0 | 1 | 2 |
|------|---|---|---|
|0     |1.0|NaN|7  |
|1     |2.0|5.0|8  |
|2     |NaN|6.0|9  |

(Did you notice that pandas upcast two of the columns to floats to accommodate the `NaN`s?)

You cannot drop a single value from a `DataFrame`, so you have to drop full rows or columns. Depending on what you are doing, you might want to do one or the other, and so pandas gives you options for both. Because in data science, columns generally represent variables and rows represent observations, you are more likely to drop rows of data; the default setting for `dropna()` is to drop all rows that contain any null values:

```python
example2.dropna()
```
```
	0	1	2
1	2.0	5.0	8
```
If necessary, you can drop NA values from columns. Use `axis=1` to do so:
```python
example2.dropna(axis=''columns'')
```
```
	2
0	7
1	8
2	9
```
Notice that this can drop a lot of data that you might want to keep, particularly in smaller datasets. What if you just want to drop rows or columns that contain several or even just all null values? You specify those setting in `dropna` with the `how` and `thresh` parameters.

By default, `how=''any''` (if you would like to check for yourself or see what other parameters the method has, run `example4.dropna?` in a code cell). You could alternatively specify `how=''all''` so as to drop only rows or columns that contain all null values. Let''s expand our example `DataFrame` to see this in action.

```python
example2[3] = np.nan
example2
```
|      |0  |1  |2  |3  |
|------|---|---|---|---|
|0     |1.0|NaN|7  |NaN|
|1     |2.0|5.0|8  |NaN|
|2     |NaN|6.0|9  |NaN|

The `thresh` parameter gives you finer-grained control: you set the number of *non-null* values that a row or column needs to have in order to be kept:
```python
example2.dropna(axis=''rows'', thresh=3)
```
```
	0	1	2	3
1	2.0	5.0	8	NaN
```
Here, the first and last row have been dropped, because they contain only two non-null values.

- **Filling null values**: Depending on your dataset, it can sometimes make more sense to fill null values with valid ones rather than drop them. You could use `isnull` to do this in place, but that can be laborious, particularly if you have a lot of values to fill. Because this is such a common task in data science, pandas provides `fillna`, which returns a copy of the `Series` or `DataFrame` with the missing values replaced with one of your choosing. Let''s create another example `Series` to see how this works in practice.
```python
example3 = pd.Series([1, np.nan, 2, None, 3], index=list(''abcde''))
example3
```
```
a    1.0
b    NaN
c    2.0
d    NaN
e    3.0
dtype: float64
```
You can fill all of the null entries with a single value, such as `0`:
```python
example3.fillna(0)
```
```
a    1.0
b    0.0
c    2.0
d    0.0
e    3.0
dtype: float64
```
You can **forward-fill** null values, which is to use the last valid value to fill a null:
```python
example3.fillna(method=''ffill'')
```
```
a    1.0
b    1.0
c    2.0
d    2.0
e    3.0
dtype: float64
```
You can also **back-fill** to propagate the next valid value backward to fill a null:
```python
example3.fillna(method=''bfill'')
```
```
a    1.0
b    2.0
c    2.0
d    3.0
e    3.0
dtype: float64
```
As you might guess, this works the same with `DataFrame`s, but you can also specify an `axis` along which to fill null values. taking the previously used `example2` again:
```python
example2.fillna(method=''ffill'', axis=1)
```
```
	0	1	2	3
0	1.0	1.0	7.0	7.0
1	2.0	5.0	8.0	8.0
2	NaN	6.0	9.0	9.0
```
Notice that when a previous value is not available for forward-filling, the null value remains.

> **Takeaway:** There are multiple ways to deal with missing values in your datasets. The specific strategy you use (removing them, replacing them, or even how you replace them) should be dictated by the particulars of that data. You will develop a better sense of how to deal with missing values the more you handle and interact with datasets.

## Removing duplicate data

> **Learning goal:** By the end of this subsection, you should be comfortable identifying and removing duplicate values from DataFrames.

In addition to missing data, you will often encounter duplicated data in real-world datasets. Fortunately, `pandas` provides an easy means of detecting and removing duplicate entries.

- **Identifying duplicates: `duplicated`**: You can easily spot duplicate values using the `duplicated` method in pandas, which returns a Boolean mask indicating whether an entry in a `DataFrame` is a duplicate of an earlier one. Let''s create another example `DataFrame` to see this in action.
```python
example4 = pd.DataFrame({''letters'': [''A'',''B''] * 2 + [''B''],
                         ''numbers'': [1, 2, 1, 3, 3]})
example4
```
|      |letters|numbers|
|------|-------|-------|
|0     |A      |1      |
|1     |B      |2      |
|2     |A      |1      |
|3     |B      |3      |
|4     |B      |3      |

```python
example4.duplicated()
```
```
0    False
1    False
2     True
3    False
4     True
dtype: bool
```
- **Dropping duplicates: `drop_duplicates`:** simply returns a copy of the data for which all of the `duplicated` values are `False`:
```python
example4.drop_duplicates()
```
```
	letters	numbers
0	A	1
1	B	2
3	B	3
```
Both `duplicated` and `drop_duplicates` default to consider all columns but you can specify that they examine only a subset of columns in your `DataFrame`:
```python
example4.drop_duplicates([''letters''])
```
```
letters	numbers
0	A	1
1	B	2
```

> **Takeaway:** Removing duplicate data is an essential part of almost every data-science project. Duplicate data can change the results of your analyses and give you inaccurate results!


## 🚀 Challenge

All of the discussed materials are provided as a Jupyter Notebook (https://github.com/microsoft/Data-Science-For-Beginners/blob/main/2-Working-With-Data/08-data-preparation/notebook.ipynb). Additionally, there are exercises present after each section, give them a try!

## Post-lecture quiz (https://ff-quizzes.netlify.app/en/ds/quiz/15)



## Review & Self Study

There are many ways to discover and approach preparing your data for analysis and modeling and cleaning the data is an important step that is a "hands on" experience. Try these challenges from Kaggle to explore techniques that this lesson didn''t cover.

- Data Cleaning Challenge: Parsing Dates (https://www.kaggle.com/rtatman/data-cleaning-challenge-parsing-dates/)

- Data Cleaning Challenge: Scale and Normalize Data (https://www.kaggle.com/rtatman/data-cleaning-challenge-scale-and-normalize-data)


## Assignment

Evaluating Data from a Form (https://raw.githubusercontent.com/microsoft/Data-Science-For-Beginners/4d2ac427ad6f022e73a75c4f46a28bbb7978ec3f/2-Working-With-Data/08-data-preparation/assignment.md)',13);
update public.books set status='APPROVED',published_at=now() where id=b;end if;
if not exists(select 1 from public.books where slug='connected-systems') then
insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values('connected-systems','Connected Systems','Microsoft and curriculum contributors','A chapter-based reading guide adapted from the openly licensed IoT-For-Beginners curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.','Networking & Security','English','https://github.com/microsoft/IoT-For-Beginners/tree/6ae558ee2b0aaade53f08b0f76505d5ea9736c43','MIT','https://github.com/microsoft/IoT-For-Beginners/blob/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/LICENSE','MIT License

Copyright (c) 2021 Microsoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
','Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained. This is a reading adaptation, not a complete standalone edition.','https://github.com/microsoft/IoT-For-Beginners/blob/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/LICENSE','Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.',true,true,89) returning id into b;
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'connected-systems-1','Introduction to IoT',1,'# Introduction to IoT



> Sketchnote by Nitya Narasimhan (https://github.com/nitya). Click the image for a larger version.

This lesson was taught as part of the Hello IoT series (https://youtube.com/playlist?list=PLmsFUfdnGr3xRts0TIwyaHyQuHaNQcb6-) from the Microsoft Reactor (https://developer.microsoft.com/reactor/?WT.mc_id=academic-17441-jabenn). The lesson was taught as 2 videos - a 1 hour lesson, and a 1 hour office hour diving deeper into parts of the lesson and answering questions.

[](https://youtu.be/bVFfcYh6UBw)

[](https://youtu.be/YI772q5v3yI)

> 🎥 Click the images above to watch the videos

## Pre-lecture quiz

Pre-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/1)

## Introduction

This lesson covers some of the introductory topics around the Internet of Things, and gets you going setting up your hardware.

In this lesson we''ll cover:

* What is the ''Internet of Things''? (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/README.md#what-is-the-internet-of-things)
* IoT devices (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/README.md#iot-devices)
* Set up your device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/README.md#set-up-your-device)
* Applications of IoT (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/README.md#applications-of-iot)
* Examples of IoT devices you may have around you (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/README.md#examples-of-iot-devices-you-may-have-around-you)

## What is the ''Internet of Things''?

The term ''Internet of Things'' was coined by Kevin Ashton (https://wikipedia.org/wiki/Kevin_Ashton) in 1999, to refer to connecting the Internet to the physical world via sensors. Since then, the term has been used to describe any device that interacts with the physical world around it, either by gathering data from sensors, or providing real-world interactions via actuators (devices that do something like turn on a switch or light an LED), generally connected to other devices or the Internet.

> **Sensors** gather information from the world, such as measuring speed, temperature or location.
>
> **Actuators** convert electrical signals into real-world interactions such as triggering a switch, turning on lights, making sounds, or sending control signals to other hardware, for example, to turn on a power socket.

IoT as a technology area is more than just devices - it includes cloud-based services that can process the sensor data, or send requests to actuators connected to IoT devices. It also includes devices that don''t have or don''t need Internet connectivity, often referred to as edge devices. These are devices that can process and respond to sensor data themselves, usually using AI models trained in the cloud.

IoT is a fast growing technology field. It is estimated that by the end of 2020, 30 billion IoT devices were deployed and connected to the Internet. Looking to the future, it is estimated that by 2025, IoT devices will be gathering almost 80 zettabytes of data or 80 trillion gigabytes. That''s a lot of data!



✅ Do a little research: How much of the data generated by IoT devices is actually used, and how much is wasted? Why is so much data ignored?

This data is the key to IoT''s success. To be a successful IoT developer, you need to understand the data you need to gather, how to gather it, how to make decisions based on it, and how to use those decisions to interact with the physical world if needed.

## IoT devices

The **T** in IoT stands for **Things** - devices that interact with the physical world around them either by gathering data from sensors or providing real-world interactions via actuators.

Devices for production or commercial use, such as consumer fitness trackers, or industrial machine controllers, are usually custom-made. They use custom circuit boards, maybe even custom processors, designed to meet the needs of a particular task, whether that''s being small enough to fit on a wrist, or rugged enough to work in a high temperature, high stress or high vibration factory environment.

As a developer either learning about IoT or creating a device prototype, you''ll need to start with a developer kit. These are general-purpose IoT devices designed for developers to use, often with features that you wouldn''t have on a production device, such as a set of external pins to connect sensors or actuators to, hardware to support debugging, or additional resources that would add unnecessary cost when doing a large manufacturing run.

These developer kits usually fall into two categories - microcontrollers and single-board computers. These will be introduced here, and we''ll go into more detail in the next lesson.

> 💁 Your phone can also be considered to be a general-purpose IoT device, with sensors and actuators built-in, with different apps using the sensors and actuators in different ways with different cloud services. You can even find some IoT tutorials that use a phone app as an IoT device.

### Microcontrollers

A microcontroller (also referred to as an MCU, short for microcontroller unit) is a small computer consisting of:

🧠 One or more central processing units (CPUs) - the ''brain'' of the microcontroller that runs your program

💾 Memory (RAM and program memory) - where your program, data and variables are stored

🔌 Programmable input/output (I/O) connections - to talk to external peripherals (connected devices) such as sensors and actuators

Microcontrollers are typically low cost computing devices, with average prices for the ones used in custom hardware dropping to around US$0.50, and some devices as cheap as US$0.03. Developer kits can start as low as US$4, with costs rising as you add more features. The Wio Terminal (https://www.seeedstudio.com/Wio-Terminal-p-4509.html), a microcontroller developer kit from Seeed studios (https://www.seeedstudio.com/) that has sensors, actuators, WiFi and a screen costs around US$30.



> 💁 When searching the Internet for microcontrollers, be wary of searching for the term **MCU** as this will bring back a lot of results for the Marvel Cinematic Universe, not microcontrollers.

Microcontrollers are designed to be programmed to do a limited number of very specific tasks, rather than being general-purpose computers like PCs or Macs. Except for very specific scenarios, you can''t connect a monitor, keyboard and mouse and use them for general purpose tasks.

Microcontroller developer kits usually come with additional sensors and actuators on board. Most boards will have one or more LEDs you can program, along with other devices such as standard plugs for adding more sensors or actuators using various manufacturers'' ecosystems or built-in sensors (usually the most popular ones such as temperature sensors). Some microcontrollers have built-in wireless connectivity such as Bluetooth or WiFi or have additional microcontrollers on the board to add this connectivity.

> 💁 Microcontrollers are usually programmed in C/C++.

### Single-board computers

A single-board computer is a small computing device that has all the elements of a complete computer contained on a single small board. These are devices that have specifications close to a desktop or laptop PC or Mac, run a full operating system, but are small, use less power, and are substantially cheaper.



The Raspberry Pi is one of the most popular single-board computers.

Like a microcontroller, single-board computers have a CPU, memory and input/output pins, but they have additional features such as a graphics chip to allow you to connect monitors, audio outputs, and USB ports to connect keyboards mice and other standard USB devices like webcams or external storage. Programs are stored on SD cards or hard drives along with an operating system, instead of a memory chip built into the board.

> 🎓 You can think of a single-board computer as a smaller, cheaper version of the PC or Mac you are reading this on, with the addition of  GPIO (general-purpose input/output) pins to interact with sensors and actuators.

Single-board computers are fully-featured computers, so can be programmed in any language. IoT devices are typically programmed in Python.

### Hardware choices for the rest of the lessons

All the subsequent lessons include assignments using an IoT device to interact with the physical world and communicate with the cloud. Each lesson supports 3 device choices - Arduino (using a Seeed Studios Wio Terminal), or a single-board computer, either a physical device (a Raspberry Pi 4) or a virtual single-board computer running on your PC or Mac.

You can read about the hardware needed to complete all the assignments in the hardware guide (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/hardware.md).

> 💁 You don''t need to purchase any IoT hardware to complete the assignments, you can do everything using a virtual single-board computer.

Which hardware you choose is up to you - it depends on what you have available either at home on in your school, and what programming language you know or plan to learn. Both hardware variants will use the same sensor ecosystem, so if you start down one path, you can change to the other without having to replace most of the kit. The virtual single-board computer will be the equivalent of learning on a Raspberry Pi, with most of the code transferrable to the Pi if you eventually get a device and sensors.

### Arduino developer kit

If you are interested in learning microcontroller development, you can complete the assignments using an Arduino device. You will need a basic understanding of C/C++ programming, as the lessons will only teach code that is relevant to the Arduino framework, the sensors and actuators being used, and the libraries that interact with the cloud.

The assignments will use Visual Studio Code (https://code.visualstudio.com/?WT.mc_id=academic-17441-jabenn) with the PlatformIO extension for microcontroller development (https://platformio.org/). You can also use the Arduino IDE if you are experienced with this tool, as instructions will not be provided.

### Single-board computer developer kit

If you are interested in learning IoT development using single-board computers, you can complete the assignments using a Raspberry Pi, or a virtual device running on your PC or Mac.

You will need a basic understanding of Python programming, as the lessons will only teach code that is relevant to the sensors and actuators being used, and the libraries that interact with the cloud.

> 💁 If you want to learn to code in Python, check out the following two video series:
>
> * Python for beginners (https://channel9.msdn.com/Series/Intro-to-Python-Development?WT.mc_id=academic-17441-jabenn)
> * More Python for beginners (https://channel9.msdn.com/Series/More-Python-for-Beginners?WT.mc_id=academic-7372-jabenn)

The assignments will use Visual Studio Code (https://code.visualstudio.com/?WT.mc_id=academic-17441-jabenn).

If you are using a Raspberry Pi, you can either run your Pi using the full desktop version of Raspberry Pi OS, and do all the coding directly on the Pi using the Raspberry Pi OS version of VS Code (https://code.visualstudio.com/docs/setup/raspberry-pi?WT.mc_id=academic-17441-jabenn), or run your Pi as a headless device and code from your PC or Mac using VS Code with the Remote SSH extension (https://code.visualstudio.com/docs/remote/ssh?WT.mc_id=academic-17441-jabenn) that allows you to connect to your Pi and edit, debug and run code as if you were coding on it directly.

If you use the virtual device option, you will code directly on your computer. Instead of accessing sensors and actuators, you will use a tool to simulate this hardware providing sensor values that you can define, and showing the results of actuators on screen.

## Set up your device

Before you can get started with programming your IoT device, you will need to do a small amount of setup. Follow the relevant instructions below depending on which device you will be using.

> 💁 If you don''t have a device yet, refer to the hardware guide (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/hardware.md) to help decide which device you are going to use, and what additional hardware you need to purchase. You don''t need to purchase hardware, as all the projects can be run on virtual hardware.

These instructions do include links to third-party websites from the creators of the hardware or tools you will be using. This is to ensure you are always using the most up-to-date instructions for the various tools and hardware.

Work through the relevant guide to set your device up and complete a ''Hello World'' project. This will be the first step in creating an IoT nightlight over the 4 lessons in this getting started part.

* Arduino - Wio Terminal (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/wio-terminal.md)
* Single-board computer - Raspberry Pi (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/pi.md)
* Single-board computer - Virtual device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/virtual-device.md)

✅ You will be using VS Code for both Arduino and Single-board computers. If you haven''t used this before, read more about it on the VS Code site (https://code.visualstudio.com/?WT.mc_id=academic-17441-jabenn)

## Applications of IoT

IoT covers a huge range of use cases, across a few broad groups:

* Consumer IoT
* Commercial IoT
* Industrial IoT
* Infrastructure IoT

✅ Do a little research: For each of the areas described below, find one concrete example that''s not given in the text.

### Consumer IoT

Consumer IoT refers to IoT devices that consumers will buy and use around the home. Some of these devices are incredibly useful, such as smart speakers, smart heating systems and robotic vacuum cleaners. Others are questionable in their usefulness, such as voice-controlled taps that then mean you cannot turn them off as the voice control cannot hear you over the sound of running water.

Consumer IoT devices are empowering people to achieve more in their surroundings, especially the 1 billion who have a disability. Robotic vacuum cleaners can provide clean floors to people with mobility issues who cannot vacuum themselves, voice-controlled ovens allow people with limited vision or motor control to heat their ovens with only their voice, health monitors can allow patients to monitor chronic conditions themselves with more regular and more detailed updates on their conditions. These devices are becoming so ubiquitous that even young children are using them as part of their daily lives, for example, students doing virtual schooling during the COVID pandemic setting timers on smart home devices to track their schoolwork or alarms to remind them of upcoming class meetings.

✅ What consumer IoT devices do you have on your person or in your home?

### Commercial IoT

Commercial IoT covers the use of IoT in the workplace. In an office setting, there may be occupancy sensors and motion detectors to manage lighting and heating to only keep the lights and heat off when not needed, reducing cost and carbon emissions. In a factory, IoT devices can monitor for safety hazards such as workers not wearing hard hats or noise that has reached dangerous levels. In retail, IoT devices can measure the temperature of cold storage, alerting the shop owner if a fridge or freezer is outside the required temperature range, or they can monitor items on shelves to direct employees to refill produce that has been sold. The transport industry is relying more and more on IoT to monitor vehicle locations, track on-road mileage for road user charging, track driver hours and break compliance, or notify staff when a vehicle is approaching a depot to prepare for loading or unloading.

✅ What commercial IoT devices do you have in your school or workplace?

### Industrial IoT (IIoT)

Industrial IoT, or IIoT, is the use of IoT devices to control and manage machinery on a large scale. This covers a wide range of use cases, from factories to digital agriculture.

Factories use IoT devices in many different ways. Machinery can be monitored with multiple sensors to track things like temperature, vibration and rotation speed. This data can then be monitored to allow the machine to be stopped if it goes outside of certain tolerances - it runs too hot and gets shut down for example. This data can also be gathered and analyzed over time to do predictive maintenance, where AI models will look at the data leading up to a failure, and use that to predict other failures before they happen.

Digital agriculture is important if the planet is to feed the growing population, especially for the 2 billion people in 500 million households that survive on subsistence farming (https://wikipedia.org/wiki/Subsistence_agriculture). Digital agriculture can range from a few single digit dollar sensors to massive commercial setups. A farmer can start by monitoring temperatures and using growing degree days (https://wikipedia.org/wiki/Growing_degree-day) to predict when a crop will be ready for harvest. They can connect soil moisture monitoring to automated watering systems to give their plants as much water as is needed, but no more to ensure their crops don''t dry out without wasting water. Farmers are even taking it further and using drones, satellite data and AI to monitor crop growth, disease and soil quality over huge areas of farmland.

✅ What other IoT devices could help farmers?

### Infrastructure IoT

Infrastructure IoT is monitoring and controlling the local and global infrastructure that people use every day.

Smart Cities (https://wikipedia.org/wiki/Smart_city) are urban areas that use IoT devices to gather data about the city and use that to improve how the city runs. These cities are usually run with collaborations between local governments, academia and local businesses, tracking and managing things varying from transport to parking and pollution. For example, in Copenhagen, Denmark, air pollution is important to the local residents, so it is measured and the data is used to provide information on the cleanest cycling and jogging routes.

Smart power grids (https://wikipedia.org/wiki/Smart_grid) allow better analytics of power demand by gathering usage data at the level of individual homes. This data can guide decisions at a country level including where to build new power stations, and at a personal level by giving users insights into how much power they are using, when they are using it, and even suggestions on how to reduce costs, such as charging electric cars at night.

✅ If you could add IoT devices to measure anything where you live, what would it be?

## Examples of IoT devices you may have around you

You''d be amazed by just how many IoT devices you have around you. I''m writing this from home and I have the following devices connected to the Internet with smart features such as app control, voice control, or the ability to send data to me via my phone:

* Multiple smart speakers
* Fridge, dishwasher, oven and microwave
* Electricity monitor for solar panels
* Smart plugs
* Video doorbell and security cameras
* Smart thermostat with multiple smart room sensors
* Garage door opener
* Home entertainment systems and voice-controlled TVs
* Lights
* Fitness and health trackers

All these types of devices have sensors and/or actuators and talk to the Internet. I can tell from my phone if my garage door is open, and ask my smart speaker to close it for me. I can even set it to a timer so if it''s still open at night, it will close automatically. When my doorbell rings, I can see from my phone who is there wherever I am in the world, and talk to them via a speaker and microphone built into the doorbell. I can monitor my blood glucose, heart rate and sleep patterns, looking for patterns in the data to improve my health. I can control my lights via the cloud, and sit in the dark when my Internet connection goes down.

---

## 🚀 Challenge

List as many IoT devices as you can that are in your home, school or workplace - there may be more than you think!

## Post-lecture quiz

Post-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/2)

## Review & Self Study

Read up on the benefits and failures of consumer IoT projects. Check news sites for articles on when it has gone wrong, such as privacy issues, hardware problems or problems caused by lack of connectivity.

Some examples:

* Check out the Twitter account **Internet of Sh*t (https://twitter.com/internetofshit)** *(profanity warning)* for some good examples of failures with consumer IoT.
* c|net - My Apple Watch saved my life: 5 people share their stories (https://www.cnet.com/news/apple-watch-lifesaving-health-features-read-5-peoples-stories/)
* c|net - ADT technician pleads guilty to spying on customer camera feeds for years (https://www.cnet.com/news/adt-home-security-technician-pleads-guilty-to-spying-on-customer-camera-feeds-for-years/) *(trigger warning - non-consensual voyeurism)*

## Assignment

Investigate an IoT project (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/1-introduction-to-iot/assignment.md)',17);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'connected-systems-2','A deeper dive into IoT',2,'# A deeper dive into IoT



> Sketchnote by Nitya Narasimhan (https://github.com/nitya). Click the image for a larger version.

This lesson was taught as part of the Hello IoT series (https://youtube.com/playlist?list=PLmsFUfdnGr3xRts0TIwyaHyQuHaNQcb6-) from the Microsoft Reactor (https://developer.microsoft.com/reactor/?WT.mc_id=academic-17441-jabenn). The lesson was taught as 2 videos - a 1 hour lesson, and a 1 hour office hour diving deeper into parts of the lesson and answering questions.

[](https://youtu.be/t0SySWw3z9M)

[](https://youtu.be/tTZYf9EST1E)

> 🎥 Click the images above to watch the videos

## Pre-lecture quiz

Pre-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/3)

## Introduction

This lesson dives deeper into some of the concepts covered in the last lesson.

In this lesson we''ll cover:

* Components of an IoT application (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/2-deeper-dive/README.md#components-of-an-iot-application)
* Deeper dive into microcontrollers (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/2-deeper-dive/README.md#deeper-dive-into-microcontrollers)
* Deeper dive into single-board computers (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/2-deeper-dive/README.md#deeper-dive-into-single-board-computers)

## Components of an IoT application

The two components of an IoT application are the *Internet* and the *thing*. Let''s look at these two components in a bit more detail.

### The Thing



The **Thing** part of IoT refers to a device that can interact with the physical world. These devices are usually small, low-priced computers, running at low speeds and using low power - for example, simple microcontrollers with kilobytes of RAM (as opposed to gigabytes in a PC) running at only a few hundred megahertz (as opposed to gigahertz in a PC), but consuming sometimes so little power they can run for weeks, months or even years on batteries.

These devices interact with the physical world, either by using sensors to gather data from their surroundings or by controlling outputs or actuators to make physical changes. The typical example of this is a smart thermostat - a device that has a temperature sensor, a means to set a desired temperature such as a dial or touchscreen, and a connection to a heating or cooling system that can be turned on when the temperature detected is outside the desired range. The temperature sensor detects that the room is too cold and an actuator turns the heating on.



There are a huge range of different things that can act as IoT devices, from dedicated hardware that senses one thing, to general purpose devices, even your smartphone! A smartphone can use sensors to detect the world around it, and actuators to interact with the world - for example using a GPS sensor to detect your location and a speaker to give you navigation instructions to a destination.

✅ Think of other systems you have around you that read data from a sensor and use that to make decisions. One example would be the thermostat on an oven. Can you find more?

### The Internet

The **Internet** side of an IoT application consists of applications that the IoT device can connect to send and receive data, as well as other applications that can process the data from the IoT device and help make decisions on what requests to send to the IoT devices actuators.

One typical setup would be having some kind of cloud service that the IoT device connects to, and this cloud service handles things like security, as well as receiving messages from the IoT device, and sending messages back to the device. This cloud service would then connect to other applications that can process or store sensor data, or use the sensor data with data from other systems to make decisions.

Devices also don''t always connect directly to the Internet themselves via WiFi or wired connections. Some devices use mesh networking to talk to each other over technologies such as Bluetooth, connecting via a hub device that has an Internet connection.

With the example of a smart thermostat, the thermostat would connect using home WiFi to a cloud service running in the cloud. It would send the temperature data to this cloud service, and from there it will be written to a database of some kind allowing the homeowner to check the current and past temperatures using a phone app. Another service in the cloud would know what temperature the homeowner wants, and send messages back to the IoT device via the cloud service to tell the heating system to turn on or off.



An even smarter version could use AI in the cloud with data from other sensors connected to other IoT devices such as occupancy sensors that detect what rooms are in use, as well as data such as weather and even your calendar, to make decisions on how to set the temperature in a smart fashion. For example, it could turn your heating off if it reads from your calendar you are on vacation, or turn off the heating on a room by room basis depending on what rooms you use, learning from the data to be more and more accurate over time.



✅ What other data could help make an Internet connected thermostat smarter?

### IoT on the Edge

Although the I in IoT stands for Internet, these devices don''t have to connect to the Internet. In some cases, devices can connect to ''edge'' devices - gateway devices that run on your local network meaning you can process data without making a call over the Internet. This can be faster when you have a lot of data or a slow Internet connection, it allows you to run offline where Internet connectivity is not possible such as on a ship or in a disaster area when responding to a humanitarian crisis, and allows you to keep data private. Some devices will contain processing code created using cloud tools and run this locally to gather and respond to data without using an Internet connection to make a decision.

One example of this is a smart home device such as an Apple HomePod, Amazon Alexa, or Google Home, which will listen to your voice using AI models trained in the cloud, but running locally on the device. These devices will ''wake up'' when a certain word or phrase is spoken, and only then send your speech over the Internet for processing. The device will stop sending speech at an appropriate point such as when it detects a pause in your speech. Everything you say before waking up the device with the wake word, and everything you say after the device has stopped listening will not be sent over the internet to the device provider, and therefore will be private.

✅ Think of other scenarios where privacy is important so processing of data would be better done on the edge rather than in the cloud. As a hint - think about IoT devices with cameras or other imaging devices on them.

### IoT Security

With any Internet connection, security is an important consideration. There is an old joke that ''the S in IoT stands for Security'' -  there is no ''S'' in IoT, implying it is not secure.

IoT devices connect to a cloud service, and therefore are only as secure as that cloud service - if your cloud service allows any device to connect then malicious data can be sent, or virus attacks can take place. This can have very real world consequences as IoT devices interact and control other devices. For example, the Stuxnet worm (https://wikipedia.org/wiki/Stuxnet) manipulated valves in centrifuges to damage them. Hackers have also taken advantage of poor security to access baby monitors (https://www.npr.org/sections/thetwo-way/2018/06/05/617196788/s-c-mom-says-baby-monitor-was-hacked-experts-say-many-devices-are-vulnerable) and other home surveillance devices.

> 💁 Sometimes IoT devices and edge devices run on a network completely isolated from the Internet to keep the data private and secure. This is known as air-gapping (https://wikipedia.org/wiki/Air_gap_(networking)).

## Deeper dive into microcontrollers

In the last lesson, we introduced microcontrollers. Let''s now look deeper into them.

### CPU

The CPU is the ''brain'' of the microcontroller. It is the processor that runs your code and can send data to and receive data from any connected devices. CPUs can contain one or more cores - essentially one or more CPUs that can work together to run your code.

CPUs rely on a clock to tick many millions or billions of times a second. Each tick, or cycle, synchronizes the actions that the CPU can take. With each tick, the CPU can execute an instruction from a program, such as to retrieve data from an external device or perform a mathematical calculation. This regular cycle allows for all actions to be completed before the next instruction is processed.

The faster the clock cycle, the more instructions that can be processed each second, and therefore the faster the CPU. CPU speeds are measured in Hertz (Hz) (https://wikipedia.org/wiki/Hertz), a standard unit where 1 Hz means one cycle or clock tick per second.

> 🎓 CPU speeds are often given in MHz or GHz. 1MHz is 1 million Hz, 1GHz is 1 billion Hz.

> 💁 CPUs execute programs using the fetch-decode-execute cycle (https://wikipedia.org/wiki/Instruction_cycle). For every clock tick, the CPU will fetch the next instruction from memory, decode it, then execute it such as using an arithmetic logic unit (ALU) to add 2 numbers. Some executions will take multiple ticks to run, so the next cycle will run at the next tick after the instruction has completed.



Microcontrollers have much lower clock speeds than desktop or laptop computers, or even most smartphones. The Wio Terminal for example has a CPU that runs at 120MHz or 120,000,000 cycles per second.

✅ An average PC or Mac has a CPU with multiple cores running at multiple GigaHertz, meaning the clock ticks billions of times a second. Research the clock speed of your computer and compare how many times faster it is than the Wio terminal.

Each clock cycle draws power and generates heat. The faster the ticks, the more power consumed and more heat generated. PC''s have heat sinks and fans to remove heat, without which they would overheat and shut down within seconds. Microcontrollers often have neither as they run much cooler and therefore much slower. PC''s run off mains power or large batteries for a few hours, microcontrollers can run for days, months, or even years off small batteries. Microcontrollers can also have cores that run at different speeds, switching to slower low power cores when the demand on the CPU is low to reduce power consumption.

> 💁 Some PCs and Macs are adopting the same mix of fast high power cores and slower low power cores, switching to save battery. For example, the M1 chip in the latest Apple laptops can switch between 4 performance cores and 4 efficiency cores to optimize battery life or speed depending on the task being run.

✅ Do a little research: Read up on CPUs on the Wikipedia CPU article (https://wikipedia.org/wiki/Central_processing_unit)

#### Task

Investigate the Wio Terminal.

If you are using a Wio Terminal for these lessons, try to find the CPU. Find the *Hardware Overview* section of the Wio Terminal product page (https://www.seeedstudio.com/Wio-Terminal-p-4509.html) for a picture of the internals, and try to find the CPU through the clear plastic window on the back.

### Memory

Microcontrollers usually have two types of memory - program memory and random-access memory (RAM).

Program memory is non-volatile, which means whatever is written to it stays when there is no power to the device. This is the memory that stores your program code.

RAM is the memory used by the program to run, containing variables allocated by your program and data gathered from peripherals. RAM is volatile, when the power goes out the contents are lost, effectively resetting your program.

> 🎓 Program memory stores your code and stays when there is no power.

> 🎓 RAM is used to run your program and is reset when there is no power

Like with the CPU, the memory on a microcontroller is orders of magnitude smaller than a PC or Mac. A typical PC might have 8 Gigabytes (GB) of RAM, or 8,000,000,000 bytes, with each byte enough space to store a single letter or a number from 0-255. A microcontroller would have only Kilobytes (KB) of RAM, with a kilobyte being 1,000 bytes. The Wio terminal mentioned above has 192KB of RAM, or 192,000 bytes - more than 40,000 times less than an average PC!

The diagram below shows the relative size difference between 192KB and 8GB - the small dot in the center represents 192KB.



Program storage is also smaller than a PC. A typical PC might have a 500GB hard drive for program storage, whereas a microcontroller might have only kilobytes or maybe a few megabytes (MB) of storage (1MB is 1,000KB, or 1,000,000 bytes). The Wio terminal has 4MB of program storage.

✅ Do a little research: How much RAM and storage does the computer you are using to read this have? How does this compare to a microcontroller?

### Input/Output

Microcontrollers need input and output (I/O) connections to read data from sensors and send control signals to actuators. They usually contain a number of general-purpose input/output (GPIO) pins. These pins can be configured in software to be input (that is they receive a signal), or output (they send a signal).

🧠⬅️ Input pins are used to read values from sensors

🧠➡️ Output pins send instructions to actuators

✅ You''ll learn more about this in a subsequent lesson.

#### Task

Investigate the Wio Terminal.

If you are using a Wio Terminal for these lessons, find the GPIO pins. Find the *Pinout diagram* section of the Wio Terminal product page (https://www.seeedstudio.com/Wio-Terminal-p-4509.html) to learn which pins are which. The Wio Terminal comes with a sticker you can mount on the back with pin numbers, so add this now if you haven''t already.

### Physical size

Microcontrollers are typically small in size, with the smallest, a Freescale Kinetis KL03 MCU is small enough to fit in the dimple of a golf ball (https://www.edn.com/tiny-arm-cortex-m0-based-mcu-shrinks-package/). Just the CPU in a PC can measure 40mm x 40mm, and that''s not including the heat sinks and fans needed to ensure the CPU can run for more than a few seconds without overheating, substantially larger than a complete microcontroller. The Wio terminal developer kit with a microcontroller, case, screen and a range of connections and components isn''t much bigger than a bare Intel i9 CPU, and substantially smaller than the CPU with a heat sink and fan!

| Device                          | Size                  |
| ------------------------------- | --------------------- |
| Freescale Kinetis KL03          | 1.6mm x 2mm x 1mm     |
| Wio terminal                    | 72mm x 57mm x 12mm    |
| Intel i9 CPU, Heat sink and fan | 136mm x 145mm x 103mm |

### Frameworks and operating systems

Due to their low speed and memory size, microcontrollers don''t run an operating system (OS) in the desktop sense of the word. The operating system that makes your computer run (Windows, Linux or macOS) needs a lot of memory and processing power to run tasks that are completely unnecessary for a microcontroller. Remember that microcontrollers are usually programmed to perform one or more very specific tasks, unlike a general purpose computer like a PC or Mac that needs to support a user interface, play music or movies, provide tools to write documents or code, play games, or browse the Internet.

To program a microcontroller without an OS you do need some tooling to allow you to build your code in a way that the microcontroller can run, using APIs that can talk to any peripherals. Each microcontroller is different, so manufacturers normally support standard frameworks which allow you to follow a standard ''recipe'' to build your code and have it run on any microcontroller that supports that framework.

You can program microcontrollers using an OS - often referred to as a real-time operating system (RTOS), as these are designed to handle sending data to and from peripherals in real time. These operating systems are very lightweight and provide features such as:

* Multi-threading, allowing your code to run more than one block of code at the same time, either on multiple cores or by taking turns on one core
* Networking to allow communicating over the Internet securely
* Graphical user interface (GUI) components for building user interfaces (UI) on devices that have screens.

✅ Read up on some different RTOSes: Azure RTOS (https://azure.microsoft.com/services/rtos/?WT.mc_id=academic-17441-jabenn), FreeRTOS (https://www.freertos.org/), Zephyr (https://www.zephyrproject.org/)

#### Arduino



Arduino (https://www.arduino.cc/) is probably the most popular microcontroller framework, especially among students, hobbyists and makers. Arduino is an open source electronics platform combining software and hardware. You can buy Arduino compatible boards from Arduino themselves or from other manufacturers, then code using the Arduino framework.

Arduino boards are coded in C or C++. Using C/C++ allows your code to be compiled very small and run fast, something needed on a constrained device such as a microcontroller. The core of an Arduino application is referred to as a sketch and is C/C++ code with 2 functions - `setup` and `loop`. When the board starts up, the Arduino framework code will run the `setup` function once, then it will run the `loop` function again and again, running it continuously until the power is powered off.

You would write your setup code in the `setup` function, such as connecting to WiFi and cloud services or initializing pins for input and output. Your loop code would then contain processing code, such as reading from a sensor and sending the value to the cloud. You would normally include a delay in each loop, for example, if you only want sensor data to be sent every 10 seconds you would add a delay of 10 seconds at the end of the loop so the microcontroller can sleep, saving power, then run the loop again when needed 10 seconds later.



✅ This program architecture is known as an *event loop* or *message loop*. Many applications use this under the hood and is the standard for most desktop applications that run on OSes like Windows, macOS or Linux. The `loop` listens for messages from user interface components such as buttons, or devices like the keyboard, and responds to them. You can read more in this article on the event loop (https://wikipedia.org/wiki/Event_loop).

Arduino provides standard libraries for interacting with microcontrollers and the I/O pins, with different implementations under the hood to run on different microcontrollers. For example, the `delay` function (https://www.arduino.cc/reference/en/language/functions/time/delay/) will pause the program for a given period of time, the `digitalRead` function (https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/) will read a value of `HIGH` or `LOW` from the given pin, regardless of which board the code is run on. These standard libraries mean that Arduino code written for one board can be recompiled for any other Arduino board and will run, assuming that the pins are the same and the boards support the same features.

There is a large ecosystem of third-party Arduino libraries that allow you to add extra features to your Arduino projects, such as using sensors and actuators or connecting to cloud IoT services.

##### Task

Investigate the Wio Terminal.

If you are using a Wio Terminal for these lessons, re-read the code you wrote in the last lesson. Find the `setup` and `loop` function. Monitor the serial output for the loop function being called repeatedly. Try adding code to the `setup` function to write to the serial port and observe that this code is only called once each time you reboot. Try rebooting your device with the power switch on the side to show this is called each time the device reboots.

## Deeper dive into single-board computers

In the last lesson, we introduced single-board computers. Let''s now look deeper into them.

### Raspberry Pi



The Raspberry Pi Foundation (https://www.raspberrypi.org/) is a charity from the UK founded in 2009 to promote the study of computer science, especially at school level. As part of this mission, they developed a single-board computer, called the Raspberry Pi. Raspberry Pis are currently available in 3 variants - a full size version, the smaller Pi Zero, and a compute module that can be built into your final IoT device.



The latest iteration of the full size Raspberry Pi is the Raspberry Pi 4B. This has a quad-core (4 core) CPU running at 1.5GHz, 2, 4, or 8GB of RAM, gigabit ethernet, WiFi, 2 HDMI ports supporting 4k screens, an audio and composite video output port, USB ports (2 USB 2.0, 2 USB 3.0), 40 GPIO pins, a camera connector for a Raspberry Pi camera module, and an SD card slot. All this on a board that is 88mm x 58mm x 19.5mm and is powered by a 3A USB-C power supply. These start at US$35, much cheaper than a PC or Mac.

> 💁 There is also a Pi400 all in one computer with a Pi4 built into a keyboard.



The Pi Zero is much smaller, with lower power. It has a single core 1GHz CPU, 512MB of RAM, WiFi (in the Zero W model), a single HDMI port, a micro-USB port, 40 GPIO pins, a camera connector for a Raspberry Pi camera module, and an SD card slot. It measures 65mm x 30mm x 5mm, and draws very little power. The Zero is US$5, with the W version with WiFi US$10.

> 🎓 The CPUs in both of these are ARM processors, as opposed to the Intel/AMD x86 or x64 processors you find in most PCs and Macs. These are similar to the CPUs you find in some microcontrollers, as well as nearly all mobile phones, the Microsoft Surface X, and the new Apple Silicon based Apple Macs.

All variants of the Raspberry Pi run a version of Debian Linux called Raspberry Pi OS. This is available as a lite version with no desktop, which is perfect for ''headless'' projects where you don''t need a screen, or a full version with a full desktop environment, with web browser, office applications, coding tools and games. As the OS is a version of Debian Linux, you can install any application or tool that runs on Debian and is built for the ARM processor inside the Pi.

#### Task

Investigate the Raspberry Pi.

If you are using a Raspberry Pi for these lessons, read up about the different hardware components on the board.

* You can find details on the processors used on the Raspberry Pi hardware documentation page (https://www.raspberrypi.org/documentation/hardware/raspberrypi/). Read up on the processor used in the Pi you are using.
* Locate the GPIO pins. Read more about them on the Raspberry Pi GPIO documentation (https://www.raspberrypi.org/documentation/hardware/raspberrypi/gpio/README.md). Use the GPIO Pin Usage guide (https://www.raspberrypi.org/documentation/usage/gpio/README.md) to identify the different pins on your Pi.

### Programming single-board computers

Single-board computers are full computers, running a full OS. This means there is a wide range of programming languages, frameworks and tools you can use to code them, unlike microcontrollers which rely on support for the board in frameworks like Arduino. Most programming languages have libraries that can access the GPIO pins to send and receive data from sensors and actuators.

✅ What programming languages are you familiar with? Are they supported on Linux?

The most common programming language for building IoT applications on a Raspberry Pi is Python. There is a huge ecosystem of hardware designed for the Pi, and nearly all of these include the relevant code needed to use them as Python libraries. Some of these ecosystems are based off ''hats'' - so called because they sit on top of the Pi like a hat and connect with a large socket to the 40 GPIO pins. These hats provide additional capabilities, such as screens, sensors, remote controlled cars, or adapters to allow you to plug in sensors with standardized cables

### Use of single-board computers in professional IoT deployments

Single-board computers are used for professional IoT deployments, not just as developer kits. They can provide a powerful way to control hardware and run complex tasks such as running machine learning models. For example, there is a Raspberry Pi 4 compute module (https://www.raspberrypi.org/blog/raspberry-pi-compute-module-4/) that provides all the power of a Raspberry Pi 4 but in a compact and cheaper form factor without most of the ports, designed to be installed into custom hardware.

---

## 🚀 Challenge

The challenge in the last lesson was to list as many IoT devices as you can that are in your home, school or workplace. For every device in this list, do you think they are built around microcontrollers or single-board computers, or even a mixture of both?

## Post-lecture quiz

Post-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/4)

## Review & Self Study

* Read the Arduino getting started guide (https://www.arduino.cc/en/Guide/Introduction) to understand more about the Arduino platform.
* Read the introduction to the Raspberry Pi 4 (https://www.raspberrypi.org/products/raspberry-pi-4-model-b/) to learn more about Raspberry Pis.
* Learn more on some of the concepts and acronyms in the What the FAQ are CPUs, MPUs, MCUs, and GPUs article in the Electrical Engineering Journal (https://www.eejournal.com/article/what-the-faq-are-cpus-mpus-mcus-and-gpus/).

✅ Use these guides, along with the costs shown by following the links in the hardware guide (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/hardware.md) to decide on what hardware platform you want to use, or if you would rather use a virtual device.

## Assignment

Compare and contrast microcontrollers and single-board computers (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/2-deeper-dive/assignment.md)',21);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'connected-systems-3','Interact with the physical world with sensors and actuators',3,'# Interact with the physical world with sensors and actuators



> Sketchnote by Nitya Narasimhan (https://github.com/nitya). Click the image for a larger version.

This lesson was taught as part of the Hello IoT series (https://youtube.com/playlist?list=PLmsFUfdnGr3xRts0TIwyaHyQuHaNQcb6-) from the Microsoft Reactor (https://developer.microsoft.com/reactor/?WT.mc_id=academic-17441-jabenn). The lesson was taught as 2 videos - a 1 hour lesson, and a 1 hour office hour diving deeper into parts of the lesson and answering questions.

[](https://youtu.be/Lqalu1v6aF4)

[](https://youtu.be/qR3ekcMlLWA)

> 🎥 Click the images above to watch the videos

## Pre-lecture quiz

Pre-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/5)

## Introduction

This lesson introduces two of the important concepts for your IoT device - sensors and actuators. You will also get hands on with them both, adding a light sensor to your IoT project, then adding an LED controlled by light levels, effectively building a nightlight.

In this lesson we''ll cover:

* What are sensors? (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/README.md#what-are-sensors)
* Use a sensor (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/README.md#use-a-sensor)
* Sensor types (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/README.md#sensor-types)
* What are actuators? (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/README.md#what-are-actuators)
* Use an actuator (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/README.md#use-an-actuator)
* Actuator types (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/README.md#actuator-types)

## What are sensors?

Sensors are hardware devices that sense the physical world - that is they measure one or more properties around them and send the information to an IoT device. Sensors cover a huge range of devices as there are so many things that can be measured, from natural properties such as air temperature to physical interactions such as movement.

Some common sensors include:

* Temperature sensors - these sense the air temperature or the temperature of what they are immersed in. For hobbyists and developers, these are often combined with air pressure and humidity in a single sensor.
* Buttons - these sense when they have been pressed.
* Light sensors - these detect light levels and can be for specific colors, UV light, IR light, or general visible light.
* Cameras - these sense a visual representation of the world by taking a photograph or streaming video.
* Accelerometers - these sense movement in multiple directions.
* Microphones - these sense sound, either general sound levels or directional sound.

✅ Do some research. What sensors does your phone have?

All sensors have one thing in common - they convert whatever they sense into an electrical signal that can be interpreted by an IoT device. How this electrical signal is interpreted depends on the sensor, as well as the communication protocol used to communicate with the IoT device.

## Use a sensor

Follow the relevant guide below to add a sensor to your IoT device:

* Arduino - Wio Terminal (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/wio-terminal-sensor.md)
* Single-board computer - Raspberry Pi (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/pi-sensor.md)
* Single-board computer - Virtual device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/virtual-device-sensor.md)

## Sensor types

Sensors are either analog or digital.

### Analog sensors

Some of the most basic sensors are analog sensors. These sensors receive a voltage from the IoT device, the sensor components adjust this voltage, and the voltage that is returned from the sensor is measured to give the sensor value.

> 🎓 Voltage is a measure of how much push there is to move electricity from one place to another, such as from a positive terminal of a battery to the negative terminal. For example, a standard AA battery is 1.5V (V is the symbol for volts) and can push electricity with the force of 1.5V from it''s positive terminal to its negative terminal. Different electrical hardware requires different voltages to work, for example, an LED can light with between 2-3V, but a 100W filament lightbulb would need 240V. You can read more about voltage on the Voltage page on Wikipedia (https://wikipedia.org/wiki/Voltage).

One example of this is a potentiometer. This is a dial that you can rotate between two positions and the sensor measures the rotation.



The IoT device will send an electrical signal to the potentiometer at a voltage, such as 5 volts (5V). As the potentiometer is adjusted it changes the voltage that comes out of the other side. Imagine you have a potentiometer labelled as a dial that goes from 0 to 11 (https://wikipedia.org/wiki/Up_to_eleven), such as a volume knob on an amplifier. When the potentiometer is in the full off position (0) then 0V (0 volts) will come out. When it is in the full on position (11), 5V (5 volts) will come out.

> 🎓 This is an oversimplification, and you can read more on potentiometers and variable resistors on the potentiometer Wikipedia page (https://wikipedia.org/wiki/Potentiometer).

The voltage that comes out of the sensor is then read by the IoT device, and the device can respond to it. Depending on the sensor, this voltage can be an arbitrary value or can map to a standard unit. For example, an analog temperature sensor based on a thermistor (https://wikipedia.org/wiki/Thermistor) changes it''s resistance depending on the temperature. The output voltage can then be converted to a temperature in Kelvin, and correspondingly into °C or °F, by calculations in code.

✅ What do you think happens if the sensor returns a higher voltage than was sent (for example coming from an external power supply)? ⛔️ DO NOT test this out.

#### Analog to digital conversion

IoT devices are digital - they can''t work with analog values, they only work with 0s and 1s. This means that analog sensor values need to be converted to a digital signal before they can be processed. Many IoT devices have analog-to-digital converters (ADCs) to convert analog inputs to digital representations of their value. Sensors can also work with ADCs via a connector board. For example, in the Seeed Grove ecosystem with a Raspberry Pi, analog sensors connect to specific ports on a ''hat'' that sits on the Pi connected to the Pi''s GPIO pins, and this hat has an ADC to convert the voltage into a digital signal that can be sent off the Pi''s GPIO pins.

Imagine you have an analog light sensor connected to an IoT device that uses 3.3V and is returning a value of 1V. This 1V doesn''t mean anything in the digital world, so needs to be converted. The voltage will be converted to an analog value using a scale depending on the device and sensor. One example is the Seeed Grove light sensor which outputs values from 0 to 1,023. For this sensor running at 3.3V, a 1V output would be a value of 300. An IoT device can''t handle 300 as an analog value, so the value would be converted to `0000000100101100`, the binary representation of 300 by the Grove hat. This would then be processed by the IoT device.

✅ If you don''t know binary, then do a small amount of research to learn how numbers are represented by 0s and 1s. The BBC Bitesize introduction to binary lesson (https://www.bbc.co.uk/bitesize/guides/zwsbwmn/revision/1) is a great place to start.

From a coding perspective, all this is usually handled by libraries that come with the sensors, so you don''t need to worry about this conversion yourself. For the Grove light sensor you would use the Python library and call the `light` property, or use the Arduino library and call `analogRead` to get a value of 300.

### Digital sensors

Digital sensors, like analog sensors, detect the world around them using changes in electrical voltage. The difference is they output a digital signal, either by only measuring two states or by using a built-in ADC. Digital sensors are becoming more and more common to avoid the need to use an ADC either in a connector board or on the IoT device itself.

The simplest digital sensor is a button or switch. This is a sensor with two states, on or off.



Pins on IoT devices such as GPIO pins can measure this signal directly as a 0 or 1. If the voltage sent is the same as the voltage returned, the value read is 1, otherwise the value read is 0. There is no need to convert the signal, it can only be 1 or 0.

> 💁 Voltages are never exact especially as the components in a sensor will have some resistance, so there is usually a tolerance. For example, the GPIO pins on a Raspberry Pi work on 3.3V, and read a return signal above 1.8V as a 1, below 1.8V as 0.

* 3.3V goes into the button. The button is off so 0V comes out, giving a value of 0
* 3.3V goes into the button. The button is on so 3.3V comes out, giving a value of 1

More advanced digital sensors read analog values, then convert them using on-board ADCs to digital signals. For example, a digital temperature sensor will still use a thermocouple in the same way as an analog sensor, and will still measure the change in voltage caused by the resistance of the thermocouple at the current temperature. Instead of returning an analog value and relying on the device or connector board to convert to a digital signal, an ADC built into the sensor will convert the value and send it as a series of 0s and 1s to the IoT device. These 0s and 1s are sent in the same way as the digital signal for a button with 1 being full voltage and 0 being 0v.



Sending digital data allows sensors to become more complex and send more detailed data, even encrypted data for secure sensors. One example is a camera. This is a sensor that captures an image and sends it as digital data containing that image, usually in a compressed format such as JPEG, to be read by the IoT device. It can even stream video by capturing images and sending either the complete image frame by frame or a compressed video stream.

## What are actuators?

Actuators are the opposite of sensors - they convert an electrical signal from your IoT device into an interaction with the physical world such as emitting light or sound, or moving a motor.

Some common actuators include:

* LED - these emit light when turned on
* Speaker - these emit sound based on the signal sent to them, from a basic buzzer to an audio speaker that can play music
* Stepper motor - these convert a signal into a defined amount of rotation, such as turning a dial 90°
* Relay - these are switches that can be turned on or off by an electrical signal. They allow a small voltage from an IoT device to turn on larger voltages.
* Screens - these are more complex actuators and show information on a multi-segment display. Screens vary from simple LED displays to high-resolution video monitors.

✅ Do some research. What actuators does your phone have?

## Use an actuator

Follow the relevant guide below to add an actuator to your IoT device, controlled by the sensor, to build an IoT nightlight. It will gather light levels from the light sensor, and use an actuator in the form of an LED to emit light when the detected light level is too low.



* Arduino - Wio Terminal (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/wio-terminal-actuator.md)
* Single-board computer - Raspberry Pi (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/pi-actuator.md)
* Single-board computer - Virtual device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/virtual-device-actuator.md)

## Actuator types

Like sensors, actuators are either analog or digital.

### Analog actuators

Analog actuators take an analog signal and convert it into some kind of interaction, where the interaction changes based off the voltage supplied.

One example is a dimmable light, such as the ones you might have in your house. The amount of voltage supplied to the light determines how bright it is.



Like with sensors, the actual IoT device works on digital signals, not analog. This means to send an analog signal, the IoT device needs a digital to analog converter (DAC), either on the IoT device directly, or on a connector board. This will convert the 0s and 1s from the IoT device to an analog voltage that the actuator can use.

✅ What do you think happens if the IoT device sends a higher voltage than the actuator can handle?
⛔️ DO NOT test this out.

#### Pulse-Width Modulation

Another option for converting digital signals from an IoT device to an analog signal is pulse-width modulation. This involves sending lots of short digital pulses that act as if it was an analog signal.

For example, you can use PWM to control the speed of a motor.

Imagine you are controlling a motor with a 5V supply. You send a short pulse to your motor, switching the voltage to high (5V) for two hundredths of a second (0.02s). In that time your motor can rotate one tenth of a rotation, or 36°. The signal then pauses for two hundredths of a second (0.02s), sending a low signal (0V). Each cycle of on then off lasts 0.04s. The cycle then repeats.



This means in one second you have 25 5V pulses of 0.02s that rotate the motor, each followed by 0.02s pause of 0V not rotating the motor. Each pulse rotates the motor one tenth of a rotation, meaning the motor completes 2.5 rotations per second. You''ve used a digital signal to rotate the motor at 2.5 rotations per second, or 150 revolutions per minute (https://wikipedia.org/wiki/Revolutions_per_minute) (a non-standard measure of rotational velocity).

```output
25 pulses per second x 0.1 rotations per pulse = 2.5 rotations per second
2.5 rotations per second x 60 seconds in a minute = 150rpm
```

> 🎓 When a PWM signal is on for half the time, and off for half it is referred to as a 50% duty cycle (https://wikipedia.org/wiki/Duty_cycle). Duty cycles are measured as the percentage time the signal is in the on state compared to the off state.



You can change the motor speed by changing the size of the pulses. For example, with the same motor you can keep the same cycle time of 0.04s, with the on pulse halved to 0.01s, and the off pulse increasing to 0.03s. You have the same number of pulses per second (25), but each on pulse is half the length. A half length pulse only turns the motor one twentieth of a rotation, and at 25 pulses a second will complete 1.25 rotations per second or 75rpm. By changing the pulse speed of a digital signal you''ve halved the speed of an analog motor.

```output
25 pulses per second x 0.05 rotations per pulse = 1.25 rotations per second
1.25 rotations per second x 60 seconds in a minute = 75rpm
```

✅ How would you keep the motor rotation smooth, especially at low speeds? Would you use a small number of long pulses with long pauses or lots of very short pulses with very short pauses?

> 💁 Some sensors also use PWM to convert analog signals to digital signals.

> 🎓 You can read more on pulse-width modulation on the pulse-width modulation page on Wikipedia (https://wikipedia.org/wiki/Pulse-width_modulation).

### Digital actuators

Digital actuators, like digital sensors, either have two states controlled by a high or low voltage or have a DAC built in so can convert a digital signal to an analog one.

One simple digital actuator is an LED. When a device sends a digital signal of 1, a high voltage is sent that lights the LED. When a digital signal of 0 is sent, the voltage drops to 0V and the LED turns off.



✅ What other simple 2-state actuators can you think of? One example is a solenoid, which is an electromagnet that can be activated to do things like move a door bolt locking/unlocking a door.

More advanced digital actuators, such as screens require the digital data to be sent in certain formats. They usually come with libraries that make it easier to send the correct data to control them.

---

## 🚀 Challenge

The challenge in the last two lessons was to list as many IoT devices as you can that are in your home, school or workplace and decide if they are built around microcontrollers or single-board computers, or even a mixture of both.

For every device you listed, what sensors and actuators are they connected to? What is the purpose of each sensor and actuator connected to these devices?

## Post-lecture quiz

Post-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/6)

## Review & Self Study

* Read up on electricity and circuits on ThingLearn (http://thinglearn.jenlooper.com/curriculum/).
* Read about the different types of temperature sensors on the Seeed Studios Temperature Sensors guide (https://www.seeedstudio.com/blog/2019/10/14/temperature-sensors-for-arduino-projects/)
* Read about LEDs on the Wikipedia LED page (https://wikipedia.org/wiki/Light-emitting_diode)

## Assignment

Research sensors and actuators (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/3-sensors-and-actuators/assignment.md)',14);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'connected-systems-4','Connect your device to the Internet',4,'# Connect your device to the Internet



> Sketchnote by Nitya Narasimhan (https://github.com/nitya). Click the image for a larger version.

This lesson was taught as part of the Hello IoT series (https://youtube.com/playlist?list=PLmsFUfdnGr3xRts0TIwyaHyQuHaNQcb6-) from the Microsoft Reactor (https://developer.microsoft.com/reactor/?WT.mc_id=academic-17441-jabenn). The lesson was taught as 2 videos - a 1 hour lesson, and a 1 hour office hour diving deeper into parts of the lesson and answering questions.

[](https://youtu.be/O4dd172mZhs)

[](https://youtu.be/j-cVCzRDE2Q)

> 🎥 Click the images above to watch the videos

## Pre-lecture quiz

Pre-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/7)

## Introduction

The **I** in IoT stands for **Internet** - the cloud connectivity and services that enable a lot of the features of IoT devices, from gathering measurements from the sensors connected to the device, to sending messages to control the actuators. IoT devices typically connect to a single cloud IoT service using a standard communication protocol, and that service is connected to the rest of your IoT application, from AI services to make smart decisions around your data, to web apps for control or reporting.

> 🎓 Data gathered from sensors and sent to the cloud is called telemetry.

IoT devices can receive messages from the cloud. Often the messages contain commands - that is instructions to perform an action either internally (such as reboot or update firmware), or using an actuator (such as turning on a light).

This lesson introduces some of the communication protocols IoT devices can use to connect to the cloud, and the types of data they might send or receive. You will also get hands-on with them both, adding internet control to your nightlight, moving the LED control logic to ''server'' code running locally.

In this lesson we''ll cover:

* Communication protocols (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/README.md#communication-protocols)
* Message Queueing Telemetry Transport (MQTT) (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/README.md#message-queueing-telemetry-transport-mqtt)
* Telemetry (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/README.md#telemetry)
* Commands (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/README.md#commands)

## Communication protocols

There are a number of popular communication protocols used by IoT devices to communicate with the Internet. The most popular are based around publish/subscribe messaging via some kind of broker. The IoT devices connect to the broker and publish telemetry and subscribe to commands. The cloud services also connect to the broker and subscribe to all the telemetry messages and publish commands either to specific devices, or to groups of devices.



MQTT is the most popular communication protocol for IoT devices and is covered in this lesson. Others protocols include AMQP and HTTP/HTTPS.

## Message Queueing Telemetry Transport (MQTT)

MQTT (http://mqtt.org/) is a lightweight, open standard messaging protocol that can send messages between devices. It was designed in 1999 to monitor oil pipelines, before being released as an open standard 15 years later by IBM.

MQTT has a single broker and multiple clients. All clients connect to the broker, and the broker routes messages to the relevant clients. Messages are routed using named topics, rather than being sent directly to an individual client. A client can publish to a topic, and any clients that subscribe to that topic will receive the message.



✅ Do some research. If you have a lot of IoT devices, how can you ensure your MQTT broker can handle all the messages?

### Connect your IoT device to MQTT

The first part of adding Internet control to your nightlight is connecting it to an MQTT broker.

#### Task

Connect your device to an MQTT broker.

In this part of the lesson, you will connect your IoT nightlight to the internet to allow it to be remotely controlled. Later in this lesson, your IoT device will send a telemetry message over MQTT to a public MQTT broker with the light level, where it will be picked up by some server code that you will write. This code will check the light level and send a command message back to the device telling it to turn the LED on or off.

The real-world use case for such a setup could be to gather data from multiple light sensors before deciding to turn on lights, in a location that has a lot of lights, such as a stadium. This could stop the lights from being turned on if only one sensor was covered by clouds or a bird, but the other sensors detected enough light.

✅ What other situations would require data from multiple sensors to be evaluated before sending commands?

Rather than dealing with the complexities of setting up an MQTT broker as part of this assignment, you can use a public test server that runs Eclipse Mosquitto (https://www.mosquitto.org/), an open-source MQTT broker. This test broker is publicly available at test.mosquitto.org (https://test.mosquitto.org/), and doesn''t require an account to be set up, making it a great tool for testing MQTT clients and servers.

> 💁 This test broker is public and not secure. Anyone could be listening to what you publish, so it should not be used with any data that needs to be kept private



Follow the relevant step below to connect your device to the MQTT broker:

* Arduino - Wio Terminal (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/wio-terminal-mqtt.md)
* Single-board computer - Raspberry Pi/Virtual IoT device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/single-board-computer-mqtt.md)

### A deeper dive into MQTT

Topics can have a hierarchy, and clients can subscribe to different levels of the hierarchy using wildcards. For example, you can send temperature telemetry messages to the `/telemetry/temperature` topic and humidity messages to the `/telemetry/humidity` topic, then in your cloud app subscribe to the `/telemetry/*` topic to receive both the temperature and humidity telemetry messages.

Messages can be sent with a quality of service (QoS), which determines the guarantee of the message being received.

* At most once - the message is sent only once and the client and broker take no additional steps to acknowledge delivery (fire and forget).
* At least once - the message is re-tried by the sender multiple times until acknowledgement is received (acknowledged delivery).
* Exactly once - the sender and receiver engage in a two-level handshake to ensure only one copy of the message is received (assured delivery).

✅ What situations might require an assured delivery message over a fire and forget message?

Although the name is Message Queueing (initials in MQTT), it doesn''t actually support message queues. This means that if a client disconnects, then reconnects it won''t receive messages sent during the disconnection, except for those messages that it had already started to process using the QoS process. Messages can have a retained flag set on them. If this is set, the MQTT broker will store the last message sent on a topic with this flag, and send this to any clients who later subscribe to the topic. This way, the clients will always get the latest message.

MQTT also supports a keep alive function that checks if the connection is still alive during long gaps between messages.

> 🦟 Mosquitto from the Eclipse Foundation (https://mosquitto.org/) has a free MQTT broker you can run yourself to experiment with MQTT, along with a public MQTT broker you can use to test your code, hosted at test.mosquitto.org (https://test.mosquitto.org/).

MQTT connections can be public and open, or encrypted and secured using usernames and passwords, or certificates.

> 💁 MQTT communicates over TCP/IP, the same underlying network protocol as HTTP, but on a different port. You can also use MQTT over websockets to communicate with web apps running in a browser, or in situations where firewalls or other networking rules block standard MQTT connections.

## Telemetry

The word telemetry is derived from Greek roots meaning to measure remotely. Telemetry is the act of gathering data from sensors and sending it to the cloud.

> 💁 One of the earliest telemetry devices was invented in France in 1874 and sent real-time weather and snow depths from Mont Blanc to Paris. It used physical wires as wireless technologies were not available at the time.

Let''s look back at the example of the smart thermostat from Lesson 1.



The thermostat has temperature sensors to gather telemetry. It would most likely have one temperature sensor built in, and it might connect to multiple external temperature sensors over a wireless protocol such as Bluetooth Low Energy (https://wikipedia.org/wiki/Bluetooth_Low_Energy) (BLE).

An example of the telemetry data it would send could be:

| Name | Value | Description |
| ---- | ----- | ----------- |
| `thermostat_temperature` | 18°C | The temperature measured by the thermostat''s built-in temperature sensor |
| `livingroom_temperature` | 19°C | The temperature measured by a remote temperature sensor that has been named `livingroom` to identify the room it is in |
| `bedroom_temperature` | 21°C | The temperature measured by a remote temperature sensor that has been named `bedroom` to identify the room it is in |

The cloud service can then use this telemetry data to make decisions around what commands to send to control the heating.

### Send telemetry from your IoT device

The next part in adding Internet control to your nightlight is sending the light level telemetry to the MQTT broker on a telemetry topic.

#### Task - send telemetry from your IoT device

Send light level telemetry to the MQTT broker.

Data is sent encoded as JSON - short for JavaScript Object Notation, a standard for encoding data in text using key/value pairs.

✅ If you''ve not come across JSON before, you can learn more about it on the JSON.org documentation (https://www.json.org/).

Follow the relevant step below to send telemetry from your device to the MQTT broker:

* Arduino - Wio Terminal (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/wio-terminal-telemetry.md)
* Single-board computer - Raspberry Pi/Virtual IoT device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/single-board-computer-telemetry.md)

### Receive telemetry from the MQTT broker

There''s no point in sending telemetry if there''s nothing on the other end to listen for it. The light level telemetry needs something listening to it to process the data. This ''server'' code is the kind of code you will deploy to a cloud service as part of a larger IoT application, but here you are going to run this code locally on your computer (or on your Pi if you are coding directly on there). The server code consists of a Python app that listens to telemetry messages over MQTT with light levels. Later in this lesson you will make it reply with a command message with instructions to turn the LED on or off.

✅ Do some research: What happens to MQTT messages if there is no listener?

#### Install Python and VS Code

If you don''t have Python and VS Code installed locally, you will need to install them both to code the server. If you are using a virtual IoT device, or are working on your Raspberry Pi you can skip this step as you should already have this installed and configured.

##### Task - install Python and VS Code

Install Python and VS Code.

1. Install Python. Refer to the Python downloads page (https://www.python.org/downloads/) for instructions on install the latest version of Python.

1. Install Visual Studio Code (VS Code). This is the editor you will be using to write your virtual device code in Python. Refer to the VS Code documentation (https://code.visualstudio.com/?WT.mc_id=academic-17441-jabenn) for instructions on installing VS Code.

    > 💁 You are free to use any Python IDE or editor for these lessons if you have a preferred tool, but the lessons will give instructions based off using VS Code.

1. Install the VS Code Pylance extension. This is an extension for VS Code that provides Python language support. Refer to the Pylance extension documentation (https://marketplace.visualstudio.com/items?WT.mc_id=academic-17441-jabenn&itemName=ms-python.vscode-pylance) for instructions on installing this extension in VS Code.

#### Configure a Python virtual environment

One of the powerful features of Python is the ability to install pip packages (https://pypi.org/) - these are packages of code written by other people and published to the Internet. You can install a pip package onto your computer with one command, then use that package in your code. You''ll be using pip to install a package to communicate over MQTT.

By default when you install a package it is available everywhere on your computer, and this can lead to problems with package versions - such as one application depending on one version of a package that breaks when you install a new version for a different application. To work around this problem, you can use a Python virtual environment (https://docs.python.org/3/library/venv.html), essentially a copy of Python in a dedicated folder, and when you install pip packages they get installed just to that folder.

##### Task - configure a Python virtual environment

Configure a Python virtual environment and install the MQTT pip packages.

1. From your terminal or command line, run the following at a location of your choice to create and navigate to a new directory:

    ```sh
    mkdir nightlight-server
    cd nightlight-server
    ```

1. Now run the following to create a virtual environment in the `.venv` folder

    ```sh
    python3 -m venv .venv
    ```

    > 💁 You need to explicitly call `python3` to create the virtual environment just in case you have Python 2 installed in addition to Python 3 (the latest version). If you have Python2 installed then calling `python` will use Python 2 instead of Python 3

1. Activate the virtual environment:

    * On Windows:
        * If you are using the Command Prompt, or the Command Prompt through Windows Terminal, run:

            ```cmd
            .venv\Scripts\activate.bat
            ```

        * If you are using PowerShell, run:

            ```powershell
            .\.venv\Scripts\Activate.ps1
            ```

    * On macOS or Linux, run:

        ```cmd
        source ./.venv/bin/activate
        ```

    > 💁 These commands should be run from the same location you ran the command to create the virtual environment. You will never need to navigate into the `.venv` folder, you should always run the activate command and any commands to install packages or run code from the folder you were in when you created the virtual environment.

1. Once the virtual environment has been activated, the default `python` command will run the version of Python that was used to create the virtual environment. Run the following to get the version:

    ```sh
    python --version
    ```

    The output will be similar to the following:

    ```output
    (.venv) ➜  nightlight-server python --version
    Python 3.9.1
    ```

    > 💁 Your Python version may be different - as long as it''s version 3.6 or higher you are good. If not, delete this folder, install a newer version of Python and try again.

1. Run the following commands to install the pip package for Paho-MQTT (https://pypi.org/project/paho-mqtt/), a popular MQTT library.

    ```sh
    pip install paho-mqtt
    ```

    This pip package will only be installed in the virtual environment, and will not be available outside of this.

#### Write the server code

The server code can now be written in Python.

##### Task - write the server code

Write the server code.

1. From your terminal or command line, run the following inside the virtual environment to create a Python file called `app.py`:

    * From Windows run:

        ```cmd
        type nul > app.py
        ```

    * On macOS or Linux, run:

        ```cmd
        touch app.py
        ```

1. Open the current folder in VS Code:

    ```sh
    code .
    ```

1. When VS Code launches, it will activate the Python virtual environment. This will be reported in the bottom status bar:

    

1. If the VS Code Terminal is already running when VS Code starts up, it won''t have the virtual environment activated in it. The easiest thing to do is kill the terminal using the **Kill the active terminal instance** button:

    

1. Launch a new VS Code Terminal by selecting *Terminal -> New Terminal, or pressing `` CTRL+` ``. The new terminal will load the virtual environment, with the call to activate this appearing in the terminal. The name of the virtual environment (`.venv`) will also be in the prompt:

    ```output
    ➜  nightlight-server source .venv/bin/activate
    (.venv) ➜  nightlight 
    ```

1. Open the `app.py` file from the VS Code explorer and add the following code:

    ```python
    import json
    import time
    
    import paho.mqtt.client as mqtt
    
    id = ''''
    
    client_telemetry_topic = id + ''/telemetry''
    client_name = id + ''nightlight_server''
    
    mqtt_client = mqtt.Client(client_name)
    mqtt_client.connect(''test.mosquitto.org'')
    
    mqtt_client.loop_start()
    
    def handle_telemetry(client, userdata, message):
        payload = json.loads(message.payload.decode())
        print("Message received:", payload)
    
    mqtt_client.subscribe(client_telemetry_topic)
    mqtt_client.on_message = handle_telemetry
    
    while True:
        time.sleep(2)
    ```

    Replace `` on line 6 with the unique ID you used when creating your device code.

    ⚠️ This **must** be the same ID that you used on your device, or the server code won''t subscribe or publish to the right topic.

    This code creates an MQTT client with a unique name, and connects to the *test.mosquitto.org* broker. It then starts a processing loop that runs in on a background thread listening for messages on any subscribed topics.

    The client then subscribes to messages on the telemetry topic, and defines a function that is called when a message is received. When a telemetry message is received, the `handle_telemetry` function is called, printing the message received to the console.

    Finally an infinite loop keeps the application running. The MQTT client is listening to messages on a background thread and runs all the time the main application is running.

1. From the VS Code terminal, run the following to run your Python app:

    ```sh
    python app.py
    ```

    The app will start listening to messages from the IoT device.

1. Make sure your device is running and sending telemetry messages. Adjust the light levels detected by your physical or virtual device. Messages being received will be printed to the terminal.

    ```output
    (.venv) ➜  nightlight-server python app.py
    Message received: {''light'': 0}
    Message received: {''light'': 400}
    ```

    The app.py file in the nightlight virtual environment has to be running for the app.py file in the nightlight-server virtual environment to receive the messages being sent.

> 💁 You can find this code in the code-server/server (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/code-server/server) folder.

### How often should telemetry be sent?

One important consideration with telemetry is how often to measure and send the data? The answer is - it depends. If you measure often you can respond faster to changes in measurements, but you use more power, more bandwidth, generate more data and need more cloud resources to process. You need to measure often enough, but not too often.

For a thermostat, measuring every few minutes is probably more than enough as temperatures don''t change that often. If you only measure once a day then you could end up heating your house for nighttime temperatures in the middle of a sunny day, whereas if you measure every second you will have thousands of unnecessarily duplicated temperature measurements that will eat into the users'' Internet speed and bandwidth (a problem for people with limited bandwidth plans), use more power which can be a problem for battery powered devices like remote sensors, and increase the cost of the providers cloud computing resources processing and storing them.

If you are monitoring data around a piece of machinery in a factory that if it fails could cause catastrophic damage and millions of dollars in lost revenue, then measuring multiple times a second might be necessary. It''s better to waste bandwidth than miss telemetry that indicates that a machine needs to be stopped and fixed before it breaks.

> 💁 In this situation, you might consider having an edge device to process the telemetry first to reduce reliance on the Internet.

### Loss of connectivity

Internet connections can be unreliable, with outages common. What should an IoT device do under these circumstances - should it lose the data, or should it store it until connectivity is restored? Again, the answer is it depends.

For a thermostat the data can probably be lost as soon as a new temperature measurement has been taken. The heating system doesn''t care that 20 minutes ago it was 20.5°C if the temperature is now 19°C, it''s the temperature now that determines if the heating should be on or off.

For machinery you might want to keep the data, especially if it is used to look for trends. There are machine learning models that can detect anomalies in streams of data by looking over data from defined period of time (such as the last hour) and spotting anomalous data. This is often used for predictive maintenance, looking for indications that something might break soon so you can repair or replace it before that happens. You might want every bit of telemetry for a machine sent so it can be processed for anomaly detection, so once the IoT device can reconnect it will send all the telemetry generated during the Internet outage.

IoT device designers should also consider if the IoT device can be used during an Internet outage or loss of signal caused by location. A smart thermostat should be able to make some limited decisions to control heating if it can''t send telemetry to the cloud due to an outage.

[](https://twitter.com/internetofshit/status/1315736960082808832)

For MQTT to handle a loss of connectivity, the device and server code will need to be responsible for ensuring message delivery if it is needed, for example by requiring that all messages sent are replied to by additional messages on a reply topic, and if not they are queued manually to be replayed later.

## Commands

Commands are messages sent by the cloud to a device, instructing it to do something. Most of the time this involves giving some kind of output via an actuator, but it can be an instruction for the device itself, such as to reboot, or gather extra telemetry and return it as a response to the command.



A thermostat could receive a command from the cloud to turn the heating on. Based on the telemetry data from all the sensors, if the cloud service has decided that the heating should be on, so it sends the relevant command.

### Send commands to the MQTT broker

The next step for our Internet controlled nightlight is for the server code to send a command back to the IoT device to control the light based on the light levels it senses.

1. Open the server code in VS Code

1. Add the following line after the declaration of the `client_telemetry_topic` to define which topic to send commands to:

    ```python
    server_command_topic = id + ''/commands''
    ```

1. Add the following code to the end of the `handle_telemetry` function:

    ```python
    command = { ''led_on'' : payload[''light'']  💁 The telemetry and commands are being sent on a single topic each. This means telemetry from multiple devices will appear on the same telemetry topic, and commands to multiple devices will appear on the same commands topic. If you wanted to send a command to a specific device, you could use multiple topics, named with a unique device id, such as `/commands/device1`, `/commands/device2`. That way a device can listen on messages just meant for that one device.

> 💁 You can find this code in the code-commands/server (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/code-commands/server) folder.

### Handle commands on the IoT device

Now that commands are being sent from the server, you can now add code to the IoT device to handle them and control the LED.

Follow the relevant step below to listen to commands from the MQTT broker:

* Arduino - Wio Terminal (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/wio-terminal-commands.md)
* Single-board computer - Raspberry Pi/Virtual IoT device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/single-board-computer-commands.md)

Once this code is written and running, experiment with changing light levels. Watch the output from the server and device, and watch the LED as you change light levels.

### Loss of connectivity

What should a cloud service do if it needs to send a command to an IoT device that is offline? Again, the answer is it depends.

If the latest command overrides an earlier one then the earlier ones can probably be ignored. If a cloud service sends a command to turn the heating on, then sends a command to turn it off, then the on command can be ignored and not resent.

If the commands need to be processed in sequence, such as move a robot arm up, then close a grabber then they need to be sent in order once connectivity is restored.

✅ How could the device or server code ensure commands are always sent and handled in order over MQTT if needed?

---

## 🚀 Challenge

The challenge in the last three lessons was to list as many IoT devices as you can that are in your home, school or workplace and decide if they are built around microcontrollers or single-board computers, or even a mixture of both, and think about what sensors and actuators they are using.

For these devices, think about what messages they might be sending or receiving. What telemetry do they send? What messages or commands might they receive? Do you think they are secure?

## Post-lecture quiz

Post-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/8)

## Review & Self Study

Read more on MQTT on the MQTT Wikipedia page (https://wikipedia.org/wiki/MQTT).

Try running an MQTT broker yourself using Mosquitto (https://www.mosquitto.org/) and connect to it from your IoT device and server code.

> 💁 Tip - by default Mosquitto doesn''t allow anonymous connections (that is connecting without a username and password), and doesn''t allow connections from outside of the computer it''s running on.
> You can fix this with a `mosquitto.conf` config file (https://www.mosquitto.org/man/mosquitto-conf-5.html) with the following:
>
> ```sh
> listener 1883 0.0.0.0
> allow_anonymous true
> ```

## Assignment

Compare and contrast MQTT with other communication protocols (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/1-getting-started/lessons/4-connect-internet/assignment.md)',21);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'connected-systems-5','Keep your plant secure',5,'# Keep your plant secure



> Sketchnote by Nitya Narasimhan (https://github.com/nitya). Click the image for a larger version.

## Pre-lecture quiz

Pre-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/19)

## Introduction

In the last few lessons you''ve created a soil monitoring IoT device and connected it to the cloud. But what if hackers working for a rival farmer managed to seize control of your IoT devices? What if they sent high soil moisture readings so your plants never got watered, or turned on your watering system to run all the time killing your plants from over-watering and costing you a small fortune in water?

In this lesson you will learn about securing IoT devices. As this is the last lesson for this project, you will also learn how to clean up your cloud resources, reducing any potential costs.

In this lesson we''ll cover:

* Why do you need to secure IoT devices? (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/2-farm/lessons/6-keep-your-plant-secure/README.md#why-do-you-need-to-secure-iot-devices)
* Cryptography (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/2-farm/lessons/6-keep-your-plant-secure/README.md#cryptography)
* Secure your IoT devices (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/2-farm/lessons/6-keep-your-plant-secure/README.md#secure-your-iot-devices)
* Generate and use an X.509 certificate (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/2-farm/lessons/6-keep-your-plant-secure/README.md#generate-and-use-an-x.509-certificates)

> 🗑 This is the last lesson in this project, so after completing this lesson and the assignment, don''t forget to clean up your cloud services. You will need the services to complete the assignment, so make sure to complete that first.
>
> Refer to the clean up your project guide (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/clean-up.md) if necessary for instructions on how to do this.

## Why do you need to secure IoT devices?

IoT security involves ensuring that only expected devices can connect to your cloud IoT service and send them telemetry, and only your cloud service can send commands to your devices. IoT data can also be personal, including medical or intimate data, so your entire application needs to consider security to stop this data being leaked.

If your IoT application is not secure, there are a number of risks:

* A fake device could send incorrect data, causing your application to respond incorrectly. For example, they could send constant high soil moisture readings, meaning your irrigation system never turns on and your plants die from lack of water
* Unauthorized users could read data from IoT devices including personal or business critical data
* Hackers could send commands to control a device in a way that could cause damage to the device or connected hardware
* By connecting to an IoT device, hackers can use this to access additional networks to get access to private systems
* Malicious users could access personal data and use this for blackmail

These are real world scenarios, and happen all the time. Some examples were given in earlier lessons, but here are some more:

* In 2018, hackers used an open WiFi access point on a fish tank thermostat to gain access to a casino''s network to steal data. The Hacker News - Casino Gets Hacked Through Its Internet-Connected Fish Tank Thermometer (https://thehackernews.com/2018/04/iot-hacking-thermometer.html)
* In 2016, the Mirai Botnet launched a denial of service attack against Dyn, an Internet service provider, taking down large portions of the Internet. This botnet used malware to connect to IoT devices such as DVRs and cameras that used default usernames and passwords, and from there launched the attack. The Guardian - DDoS attack that disrupted internet was largest of its kind in history, experts say (https://www.theguardian.com/technology/2016/oct/26/ddos-attack-dyn-mirai-botnet)
* Spiral Toys had a database of users of their CloudPets connected toys publicly available over the Internet. Troy Hunt - Data from connected CloudPets teddy bears leaked and ransomed, exposing kids'' voice messages (https://www.troyhunt.com/data-from-connected-cloudpets-teddy-bears-leaked-and-ransomed-exposing-kids-voice-messages/).
* Strava tagged runners that you ran past and showed their routes, allowing strangers to effectively see where you live. Kim Komndo - Fitness app could lead a stranger right to your home — change this setting (https://www.komando.com/security-privacy/strava-fitness-app-privacy/755349/).

✅ Do some research: Search for more examples IoT Hacks and breaches of IoT data, especially with personal items such as Internet connected toothbrushes or scales. Think about the impact these hacks could have on the victims or customers.

> 💁 Security is a massive topic, and this lesson will only touch on some of the basics around connecting your device to the cloud. Other topics that won''t be covered include monitoring for data changes in transit, hacking devices directly, or changes to device configurations. IoT hacking is such a threat, tools like Azure Defender for IoT (https://azure.microsoft.com/services/azure-defender-for-iot/?WT.mc_id=academic-17441-jabenn) have been developed. These tools are similar to the anti-virus and security tools you might have on your computer, just designed for small, low powered IoT devices.

## Cryptography

When a device connects to an IoT service, it uses an ID to identify itself. The problem is this ID can be cloned - a hacker could set up a malicious device that uses the same ID as a real device but sends bogus data.



The way round this is to convert the data being sent into a scrambled format, using some kind of value to scramble the data known to the device and the cloud only. This process is called *encryption*, and the value used to encrypt the data is called an *encryption key*.



The cloud service can then convert the data back to a readable format, using a process called *decryption*, using either the same encryption key, or a *decryption key*. If the encrypted message cannot be decrypted by the key, the device has been hacked and the message is rejected.

The technique for doing encryption and decryption is called *cryptography*.

### Early cryptography

The earliest types of cryptography were substitution ciphers, dating back 3,500 years. Substitution ciphers involve substituting one letter for another. For example, the Caesar cipher (https://wikipedia.org/wiki/Caesar_cipher) involves shifting the alphabet by a defined amount, with only the sender of the encrypted message, and the intended recipient knowing how many letters to shift.

The Vigenère cipher (https://wikipedia.org/wiki/Vigen%C3%A8re_cipher) took this further by using words to encrypt text, so that each letter in the original text was shifted by a different amount, rather than always shifting by the same number of letters.

Cryptography was used for a wide range of purposes, such as protecting a potters glaze recipe in ancient Mesopotamia, writing secret love notes in India, or keeping ancient Egyptian magical spells secret.

### Modern cryptography

Modern cryptography is much more advanced, making it harder to crack than early methods. Modern cryptography uses complicated mathematics to encrypt data with far too many possible keys to make brute force attacks possible.

Cryptography is used in a lot of different ways for secure communications. If you are reading this page on GitHub, you may notice the web site address starts with *HTTPS*, meaning that the communication between your browser and the web servers of GitHub is encrypted. If someone was able to read the internet traffic flowing between your browser and GitHub, they wouldn''t be able to read the data as it is encrypted. Your computer might even encrypt all the data on your hard drive so if someone steals it, they won''t be able to read any of your data without your password.

> 🎓 HTTPS stands for HyperText Transfer Protocol **Secure**

Unfortunately, not everything is secure. Some devices have no security, others are secured using easy to crack keys, or sometimes even all the devices of the same type using the same key. There have been accounts of very personal IoT devices that all have the same password to connect to them over WiFi or Bluetooth. If you can connect to your own device, you can connect to someone else''s. Once connected you could access some very private data, or have control over their device.

> 💁 Despite the complexities of modern cryptography and the claims that breaking encryption can take billions of years, the rise of quantum computing has led to the possibility of breaking all know encryption in a very short space of time!

### Symmetric and asymmetric keys

Encryption comes in two types - symmetric and asymmetric.

**Symmetric** encryption uses the same key to encrypt and decrypt the data. Both the sender and receiver need to know the same key. This is the least secure type, as the key needs to be shared somehow. For a sender to send an encrypted message to a recipient, the sender first might have to send the recipient the key.



If the key gets stolen in transit, or the sender or recipient get hacked and the key is found, the encryption can be cracked.



**Asymmetric** encryption uses 2 keys - an encryption key and a decryption key, referred to as a public/private key pair. The public key is used to encrypt the message, but cannot be used to decrypt it, the private key is used to decrypt the message but cannot be used to encrypt it.



The recipient shares their public key, and the sender uses this to encrypt the message. Once the message is sent, the recipient decrypts it with their private key. Asymmetric encryption is more secure as the private key is kept private by the recipient and never shared. Anyone can have the public key as it can only be used to encrypt messages.

Symmetric encryption is faster than asymmetric encryption, asymmetric is more secure. Some systems will use both - using asymmetric encryption to encrypt and share the symmetric key, then using the symmetric key to encrypt all data. This makes it more secure to share the symmetric key between sender and recipient, and faster when encrypting and decrypting data.

## Secure your IoT devices

IoT devices can be secured using symmetric or asymmetric encryption. Symmetric is easier, but less secure.

### Symmetric keys

When you set up your IoT device to interact with IoT Hub, you used a connection string. An example connection string is:

```output
HostName=soil-moisture-sensor.azure-devices.net;DeviceId=soil-moisture-sensor;SharedAccessKey=<your-device-key>
```

This connection string is made of three parts separated by semi-colons, with each part a key and a value:

| Key | Value | Description |
| --- | ----- | ----------- |
| HostName | `soil-moisture-sensor.azure-devices.net` | The URL of the IoT Hub |
| DeviceId | `soil-moisture-sensor` | The unique ID of the device |
| SharedAccessKey | `Bhry+ind7kKEIDxubK61RiEHHRTrPl7HUow8cEm/mU0=` | A symmetric key known by the device and the IoT Hub |

The last part of this connection string, the `SharedAccessKey`, is the symmetric key known by both the device and the IoT Hub. This key is never sent from the device to the cloud, or the cloud to the device. Instead it is used to encrypt data that is sent or received.

✅ Do an experiment. What do you think will happen if you change the `SharedAccessKey` part of the connection string when connecting your IoT device? Try it out.

When the device first tries to connect it sends a shared access signature (SAS) token consisting of the URL of the IoT Hub, a timestamp that the access signature will expire (usually 1 day from the current time), and a signature. This signature consists of the URL and the expiry time encrypted with the shared access key from the connection string.

The IoT Hub decrypts this signature with the shared access key, and if the decrypted value matches the URL and expiry, the device is allowed to connect. It also verifies that the current time is before the expiry, to stop a malicious device capturing the SAS token of a real device and using it.

This is an elegant way to verify that the sender is the correct device. By sending some known data in both a decrypted and encrypted form, the server can verify the device by ensuring when it decrypts the encrypted data, the result matches the decrypted version that was sent. If it matches, then both the sender and recipient have the same symmetric encryption key.

> 💁 Because of the expiry time, your IoT device needs to know the accurate time, usually read from an NTP (https://wikipedia.org/wiki/Network_Time_Protocol) server. If the time is not accurate, the connection will fail.

After the connection, all data sent to the IoT Hub from the device, or to the device from the IoT Hub will be encrypted with the shared access key.

✅ What do you think will happen if multiple devices share the same connection string?

> 💁 It is bad security practice to store this key in code. If a hacker gets your source code, they can get your key. It is also harder when releasing code as you would need to recompile with an updated key for every device. It is better to load this key from a hardware security module - a chip on the IoT device that stores encrypted values that can be read by your code.
>
> When learning IoT it is often easier to put the key in code, as you did in an earlier lesson, but you must ensure this key is not checked into public source code control.

Devices have 2 keys, and 2 corresponding connection strings. This allows you to rotate the keys - that is switch from one key to another if the first gets compromised, and re-generate the first key.

### X.509 certificates

When you are using asymmetric encryption with a public/private key pair, you need to provide your public key to anyone who wants to send you data. The problem is, how can the recipient of your key be sure it''s actually your public key, not someone else pretending to be you? Instead of providing a key, you can instead provide your public key inside a certificate that has been verified by a trusted third party, called an X.509 certificate.

X.509 certificates are digital documents that contain the public key part of the public/private key pair. They are usually issued by one of a number of trusted organizations called Certification authorities (https://wikipedia.org/wiki/Certificate_authority) (CAs), and digitally signed by the CA to indicate the key is valid and comes from you. You trust the certificate and that the public key is from who the certificate says it is from, because you trust the CA, similar to how you would trust a passport or driving license because you trust the country issuing it. Certificates cost money, so you can also ''self-sign'', that is create a certificate yourself that is signed by you, for testing purposes.

> 💁 You should never use a self-signed certificate for a production release.

These certificates have a number of fields in them, including who the public key is from, the details of the CA who issued it, how long it is valid for, and the public key itself. Before using a certificate, it is good practice to verify it by checking that is was signed by the original CA.

✅ You can read a full list of the fields in the certificate in the Microsoft Understanding X.509 Public Key Certificates tutorial (https://docs.microsoft.com/azure/iot-hub/tutorial-x509-certificates?WT.mc_id=academic-17441-jabenn#certificate-fields)

When using X.509 certificates, both the sender and the recipient will have their own public and private keys, as well as both having X.509 certificates that contain the public key. They then exchange X.509 certificates somehow, using each others public keys to encrypt the data they send, and their own private key to decrypt the data they receive.



One big advantage of using X.509 certificates is that they can be shared between devices. You can create one certificate, upload it to IoT Hub, and use this for all your devices. Each device then just needs to know the private key to decrypt the messages it receives from IoT Hub.

The certificate used by your device to encrypt messages it sends to the IoT Hub is published by Microsoft. It is the same certificate that a lot of Azure services use, and is sometimes built into the SDKs

> 💁 Remember, a public key is just that - public. The Azure public key can only be used to encrypt data sent to Azure, not to decrypt it, so it can be shared everywhere, including in source code. For example, you can see it in the Azure IoT C SDK source code (https://github.com/Azure/azure-iot-sdk-c/blob/master/certs/certs.c).

✅ There is a lot of jargon with X.509 certificates. You can read the definitions of some of the terms you might come across in The layman’s guide to X.509 certificate jargon (https://techcommunity.microsoft.com/t5/internet-of-things/the-layman-s-guide-to-x-509-certificate-jargon/ba-p/2203540?WT.mc_id=academic-17441-jabenn)

## Generate and use an X.509 certificate

The steps to generate an X.509 certificate are:

1. Create a public/private key pair. One of the most widely used algorithm to generate a public/private key pair is called Rivest–Shamir–Adleman (https://wikipedia.org/wiki/RSA_(cryptosystem))(RSA).

1. Submit the public key with associated data for signing, either by a CA, or by self-signing

The Azure CLI has commands to create a new device identity in IoT Hub, and automatically generate the public/private key pair and create a self-signed certificate.

> 💁 If you want to see the steps in detail, rather than using the Azure CLI, you can find it in the Using OpenSSL to create self-signed certificates tutorial in the Microsoft IoT Hub documentation (https://docs.microsoft.com/azure/iot-hub/tutorial-x509-self-sign?WT.mc_id=academic-17441-jabenn)

### Task - create a device identity using an X.509 certificate

1. Run the following command to register the new device identity, automatically generating the keys and certificates:

    ```sh
    az iot hub device-identity create --device-id soil-moisture-sensor-x509 \
                                      --am x509_thumbprint \
                                      --output-dir . \
                                      --hub-name 
    ```

    Replace `` with the name you used for your IoT Hub.

    This will create a device with an ID of `soil-moisture-sensor-x509` to distinguish from the device identity you created in the last lesson. This command will also create 2 files in the current directory:

    * `soil-moisture-sensor-x509-key.pem` - this file contains the private key for the device.
    * `soil-moisture-sensor-x509-cert.pem` - this is the X.509 certificate file for the device.

    Keep these files safe! The private key file should not be checked into public source code control.

### Task - use the X.509 certificate in your device code

Work through the relevant guide to connect your IoT device to the cloud using the X.509 certificate:

* Arduino - Wio Terminal (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/2-farm/lessons/6-keep-your-plant-secure/wio-terminal-x509.md)
* Single-board computer - Raspberry Pi/Virtual IoT device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/2-farm/lessons/6-keep-your-plant-secure/single-board-computer-x509.md)

---

## 🚀 Challenge

There are multiple ways to create, manage and delete Azure services such as Resource Groups and IoT Hubs. One way is the Azure Portal (https://portal.azure.com/?WT.mc_id=academic-17441-jabenn) - a web-based interface that gives you a GUI to manage your Azure services.

Head to portal.azure.com (https://portal.azure.com/?WT.mc_id=academic-17441-jabenn) and investigate the portal. See if you can create an IoT Hub using the portal, then delete it.

**Hint** - when creating services through the portal, you don''t need to create a Resource Group up front, one can be created when you are creating the service. Make sure you delete it when you are finished!

You can find plenty of documentation, tutorials and guides on the Azure Portal in the Azure portal documentation (https://docs.microsoft.com/azure/azure-portal/?WT.mc_id=academic-17441-jabenn).

## Post-lecture quiz

Post-lecture quiz (https://black-meadow-040d15503.1.azurestaticapps.net/quiz/20)

## Review & Self Study

* Read up on the history of cryptography on the History of cryptography page on Wikipedia (https://wikipedia.org/wiki/History_of_cryptography).
* Read up on X.509 certificates on the X.509 page on Wikipedia (https://wikipedia.org/wiki/X.509).

## Assignment

Build a new IoT device (https://raw.githubusercontent.com/microsoft/IoT-For-Beginners/6ae558ee2b0aaade53f08b0f76505d5ea9736c43/2-farm/lessons/6-keep-your-plant-secure/assignment.md)',16);
update public.books set status='APPROVED',published_at=now() where id=b;end if;
if not exists(select 1 from public.books where slug='generative-ai-foundations') then
insert into public.books(slug,title,author,description,category,language,source_url,license_name,license_url,attribution,changes_made,license_evidence_url,license_evidence_notes,commercial_use_allowed,redistribution_confirmed,est_minutes) values('generative-ai-foundations','Generative AI Foundations','Microsoft and curriculum contributors','A chapter-based reading guide adapted from the openly licensed generative-ai-for-beginners curriculum. Includes original lessons, examples and exercises; linked labs remain at the source.','Artificial Intelligence','English','https://github.com/microsoft/generative-ai-for-beginners/tree/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8','MIT','https://github.com/microsoft/generative-ai-for-beginners/blob/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/LICENSE','    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
','Selected curriculum lessons arranged as chapters. Images and embeds omitted; relative links resolved to the pinned source. Text and examples retained. This is a reading adaptation, not a complete standalone edition.','https://github.com/microsoft/generative-ai-for-beginners/blob/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/LICENSE','Reviewed the pinned repository MIT license and the exact included Markdown chapters. Third-party images and embeds excluded. Full copyright and license notice retained.',true,true,59) returning id into b;
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'generative-ai-foundations-1','Introduction to Generative AI and Large Language Models',1,'# Introduction to Generative AI and Large Language Models

[](https://youtu.be/lFXQkBvEe0o?si=6ZBcQTwLJJDpnX0K)

_(Click the image above to view video of this lesson)_

Generative AI is artificial intelligence capable of generating text, images and other types of content. What makes it a fantastic technology is that it democratizes AI, anyone can use it with as little as a text prompt, a sentence written in a natural language. There''s no need for you to learn a language like Java or SQL to accomplish something worthwhile, all you need is to use your language, state what you want and out comes a suggestion from an AI model. The applications and impact for this are huge, you write or understand reports, write applications and much more, all in seconds.

In this curriculum, we’ll explore how our startup leverages generative AI to unlock new scenarios in the education world and how we address the inevitable challenges associated with the social implications of its application and the technology limitations.

## Introduction

This lesson will cover:

- Introduction to the business scenario: our startup idea and mission.
- Generative AI and how we landed on the current technology landscape.
- Inner working of a large language model.
- Main capabilities and practical use cases of Large Language Models.

## Learning Goals

After completing this lesson, you will understand:

- What generative AI is and how Large Language Models work.
- How you can leverage large language models for different use cases, with a focus on education scenarios.

## Scenario: our educational startup

Generative Artificial Intelligence (AI) represents the pinnacle of AI technology, pushing the boundaries of what was once thought impossible. Generative AI models have several capabilities and applications, but for this curriculum we''ll explore how it''s revolutionizing education through a fictional startup. We''ll refer to this startup as _our startup_. Our startup works in the education domain with the ambitious mission statement of

> _improving accessibility in learning, on a global scale, ensuring equitable access to education and providing personalized learning experiences to every learner, according to their needs_.

Our startup team is aware we’ll not be able to achieve this goal without leveraging one of the most powerful tools of modern times – Large Language Models (LLMs).

Generative AI is expected to revolutionize the way we learn and teach today, with students having at their disposal virtual teachers 24 hours a day who provide vast amounts of information and examples, and teachers able to leverage innovative tools to assess their students and give feedback.



To start, let’s define some basic concepts and terminology we’ll be using throughout the curriculum.

## How did we get Generative AI?

Despite the extraordinary _hype_ created lately by the announcement of generative AI models, this technology is decades in the making, with the first research efforts dating back to the 60s. We''re now at a point with AI having human cognitive capabilities, like conversation as shown by for example OpenAI ChatGPT (https://openai.com/chatgpt) or Microsoft Copilot (https://copilot.microsoft.com/?WT.mc_id=academic-105485-koreyst), which also uses a GPT model for its conversational web search experience.

Backing up a bit, the very first prototypes of AI consisted of typewritten chatbots, relying on a knowledge base extracted from a group of experts and represented into a computer. The answers in the knowledge base were triggered by keywords appearing in the input text.
However, it soon became clear that such an approach, using typewritten chatbots, did not scale well.

### A statistical approach to AI: Machine Learning

A turning point arrived during the 90s, with the application of a statistical approach to text analysis. This led to the development of new algorithms – known as machine learning – capable of learning patterns from data without being explicitly programmed. This approach allows machines to simulate human language understanding: a statistical model is trained on text-label pairings, enabling the model to classify unknown input text with a pre-defined label representing the intention of the message.

### Neural networks and modern virtual assistants

In recent years, the technological evolution of hardware, capable of handling larger amounts of data and more complex computations, encouraged research in AI, leading to the development of advanced machine learning algorithms known as neural networks or deep learning algorithms.

Neural networks (and in particular Recurrent Neural Networks – RNNs) significantly enhanced natural language processing, enabling the representation of the meaning of text in a more meaningful way, valuing the context of a word in a sentence.

This is the technology that powered the virtual assistants born in the first decade of the new century, very proficient in interpreting human language, identifying a need, and performing an action to satisfy it – like answering with a pre-defined script or consuming a 3rd party service.

### Present day, Generative AI

So that’s how we came to Generative AI today, which can be seen as a subset of deep learning.



After decades of research in the AI field, a new model architecture – called _Transformer_ – overcame the limits of RNNs, being able to get much longer sequences of text as input. Transformers are based on the attention mechanism, enabling the model to give different weights to the inputs it receives, ‘paying more attention’ where the most relevant information is concentrated, regardless of their order in the text sequence.

Most of the recent generative AI models – also known as Large Language Models (LLMs), since they work with textual inputs and outputs – are indeed based on this architecture. What’s interesting about these models – trained on a huge amount of unlabeled data from diverse sources like books, articles and websites – is that they can be adapted to a wide variety of tasks and generate grammatically correct text with a semblance of creativity. So, not only did they incredibly enhance the capacity of a machine to ‘understand’ an input text, but they enabled their capacity to generate an original response in human language.

## How do large language models work?

In the next chapter we are going to explore different types of Generative AI models, but for now let’s have a look at how large language models work, with a focus on OpenAI GPT (Generative Pre-trained Transformer) models.

- **Tokenizer, text to numbers**: Large Language Models receive a text as input and generate a text as output. However, being statistical models, they work much better with numbers than text sequences. That’s why every input to the model is processed by a tokenizer, before being used by the core model. A token is a chunk of text – consisting of a variable number of characters, so the tokenizer''s main task is splitting the input into an array of tokens. Then, each token is mapped with a token index, which is the integer encoding of the original text chunk.



- **Predicting output tokens**: Given n tokens as input (with max n varying from one model to another), the model is able to predict one token as output. This token is then incorporated into the input of the next iteration, in an expanding window pattern, enabling a better user experience of getting one (or multiple) sentence as an answer. This explains why, if you ever played with ChatGPT, you might have noticed that sometimes it looks like it stops in the middle of a sentence.

- **Selection process, probability distribution**: The output token is chosen by the model according to its probability of occurring after the current text sequence. This is because the model predicts a probability distribution over all possible ‘next tokens’, calculated based on its training. However, not always is the token with the highest probability chosen from the resulting distribution. A degree of randomness is added to this choice, in a way that the model acts in a non-deterministic fashion - we do not get the exact same output for the same input. This degree of randomness is added to simulate the process of creative thinking and it can be tuned using a model parameter called temperature.

## How can our startup leverage Large Language Models?

Now that we have a better understanding of the inner working of a large language model, let’s see some practical examples of the most common tasks they can perform pretty well, with an eye to our business scenario.
We said that the main capability of a Large Language Model is _generating a text from scratch, starting from a textual input, written in natural language_.

But what kind of textual input and output?
The input of a large language model is known as a prompt, while the output is known as a completion, term that refers to the model mechanism of generating the next token to complete the current input. We are going to dive deep into what is a prompt and how to design it in a way to get the most out of our model. But for now, let’s just say that a prompt may include:

- An **instruction** specifying the type of output we expect from the model. This instruction sometimes might embed some examples or some additional data.

  1. Summarization of an article, book, product reviews and more, along with extraction of insights from unstructured data.
    
    
  
  2. Creative ideation and design of an article, an essay, an assignment or more.
      
     

- A **question**, asked in the form of a conversation with an agent.
  
  

- A chunk of **text to complete**, which implicitly is an ask for writing assistance.
  
  

- A chunk of **code** together with the ask of explaining and documenting it, or a comment asking to generate a piece of code performing a specific task.
  
  

The examples above are quite simple and are not intended to be an exhaustive demonstration of Large Language Models'' capabilities. They are meant to show the potential of using generative AI, in particular but not limited to educational contexts.

Also, the output of a generative AI model is not perfect and sometimes the creativity of the model can work against it, resulting in an output which is a combination of words that the human user can interpret as a mystification of reality, or it can be offensive. Generative AI is not intelligent - at least in the more comprehensive definition of intelligence, including critical and creative reasoning or emotional intelligence; it is not deterministic, and it is not trustworthy, since fabrications, such as erroneous references, content, and statements, may be combined with correct information, and presented in a persuasive and confident manner. In the following lessons, we’ll be dealing with all these limitations and we’ll see what we can do to mitigate them.

## Assignment

Your assignment is to read up more on generative AI (https://en.wikipedia.org/wiki/Generative_artificial_intelligence?WT.mc_id=academic-105485-koreyst) and try to identify an area where you would add generative AI today that doesn''t have it. How would the impact be different from doing it the "old way", can you do something you couldn''t before, or are you faster? Write a 300 word summary on what your dream AI startup would look like and include headers like "Problem", "How I would use AI", "Impact" and optionally a business plan.

If you did this task, you might even be ready to apply to Microsoft''s incubator, Microsoft for Startups Founders Hub (https://www.microsoft.com/startups?WT.mc_id=academic-105485-koreyst) we offer credits for both Azure, OpenAI, mentoring and much more, check it out!

## Knowledge check

What''s true about large language models?

1. You get the exact same response every time.
1. It does things perfectly, great at adding numbers, produce working code etc.
1. The response may vary despite using the same prompt. It''s also great at giving you a first draft of something, be it text or code. But you need to improve on the results.

A: 3, an LLM is non-deterministic, the response varies, however, you can control its variance via a temperature setting. You also shouldn''t expect it to do things perfectly, it''s here to do the heavy-lifting for you which often means you get a good first attempt at something that you need to gradually improve.

## Great Work! Continue the Journey

After completing this lesson, check out our Generative AI Learning collection (https://aka.ms/genai-collection?WT.mc_id=academic-105485-koreyst) to continue leveling up your Generative AI knowledge!

Head over to Lesson 2 where we will look at how to explore and compare different LLM types (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/02-exploring-and-comparing-different-llms/README.md?WT.mc_id=academic-105485-koreyst)!',11);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'generative-ai-foundations-2','Exploring and comparing different LLMs',2,'# Exploring and comparing different LLMs

[](https://youtu.be/KIRUeDKscfI?si=8BHX1zvwzQBn-PlK)

> _Click the image above to view video of this lesson_

With the previous lesson, we have seen how Generative AI is changing the technology landscape, how Large Language Models (LLMs) work and how a business - like our startup - can apply them to their use cases and grow! In this chapter, we''re looking to compare and contrast different types of large language models (LLMs) to understand their pros and cons.

The next step in our startup''s journey is exploring the current landscape of LLMs and understanding which are suitable for our use case.

## Introduction

This lesson will cover:

- Different types of LLMs in the current landscape.
- Testing, iterating, and comparing different models for your use case in Azure.
- How to deploy an LLM.

## Learning Goals

After completing this lesson, you will be able to:

- Select the right model for your use case.
- Understand how to test, iterate, and improve the performance of your model.
- Know how businesses deploy models.

## Understand different types of LLMs

LLMs can have multiple categorizations based on their architecture, training data, and use case. Understanding these differences will help our startup select the right model for the scenario, and understand how to test, iterate, and improve performance.

There are many different types of LLM models, your choice of model depends on what you aim to use them for, your data, how much you''re ready to pay and more.

Depending on if you aim to use the models for text, audio, video, image generation and so on, you might opt for a different type of model.

- **Audio and speech recognition**. Whisper-style models are still useful general-purpose speech recognition models, but production choices now also include newer speech-to-text models such as `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, and diarization variants. Evaluate language coverage, diarization, real-time support, latency, and cost for your scenario. Learn more in the OpenAI speech-to-text documentation (https://platform.openai.com/docs/guides/speech-to-text?WT.mc_id=academic-105485-koreyst).

- **Image generation**. DALL-E and Midjourney are well-known image generation options, but current OpenAI image APIs center on GPT Image models such as `gpt-image-2`, while Stable Diffusion, Imagen, Flux, and other model families are also common choices. Compare prompt adherence, editing support, style control, safety requirements, and licensing. Learn more in the OpenAI image generation guide (https://platform.openai.com/docs/guides/images?WT.mc_id=academic-105485-koreyst) and Chapter 9 of this curriculum.

- **Text generation**. Text models now span frontier models, reasoning models, smaller low-latency models, and open-weight models. Current examples include OpenAI GPT-5.x models, Anthropic Claude 4.x models, Google Gemini 3.x models, Meta Llama 4 models, and Mistral models. Do not choose only by release date or price; compare task quality, latency, context window, tool use, safety behavior, regional availability, and total cost. The Microsoft Foundry model catalog (https://ai.azure.com/catalog?WT.mc_id=academic-105485-koreyst) is a good place to compare models available on Azure.

- **Multi-modality**. Many current models can process more than text. Some accept image, audio, or video inputs; some can call tools; and specialized models can generate images, audio, or video. For example, current OpenAI models support text and image input, Gemini models can support text, code, image, audio, and video inputs depending on the variant, and Llama 4 Scout and Maverick are open-weight natively multimodal models. Always check each model card for supported input and output modalities before building a workflow around it.

Selecting a model means you get some basic capabilities, that might not be enough however. Often you have company specific data that you somehow need to tell the LLM about. There are a few different choices on how to approach that, more on that in the upcoming sections.

### Foundation Models versus LLMs

The term Foundation Model was coined by Stanford researchers (https://arxiv.org/abs/2108.07258?WT.mc_id=academic-105485-koreyst) and defined as an AI model that follows some criteria, such as:

- **They are trained using unsupervised learning or self-supervised learning**, meaning they are trained on unlabeled multi-modal data, and they do not require human annotation or labeling of data for their training process.
- **They are very large models**, based on very deep neural networks trained on billions of parameters.
- **They are normally intended to serve as a ‘foundation’ for other models**, meaning they can be used as a starting point for other models to be built on top of, which can be done by fine-tuning.



Image source: Essential Guide to Foundation Models and Large Language Models | by Babar M Bhatti | Medium
 (https://thebabar.medium.com/essential-guide-to-foundation-models-and-large-language-models-27dab58f7404)

To further clarify this distinction, let’s take ChatGPT as a historical example. Early versions of ChatGPT used GPT-3.5 as a foundation model. OpenAI then used chat-specific data and alignment techniques to create a tuned version that performed better in conversational scenarios, such as chatbots. Modern AI services often route between several model variants, so the service name and the underlying model name are not always the same thing.



Image source: 2108.07258.pdf (arxiv.org) (https://arxiv.org/pdf/2108.07258.pdf?WT.mc_id=academic-105485-koreyst)

### Open-Weight/Open-Source versus Proprietary Models

Another way to categorize LLMs is whether they are open-weight, open-source, or proprietary.

Open-source and open-weight models make model artifacts available for inspection, download, or customization, but their licenses differ. Some are fully open source, while others are open-weight models with usage restrictions. They can be useful when a business needs more control over deployment, data locality, cost, or customization. However, teams still need to review license terms, serving costs, maintenance, security updates, and evaluation quality before using them in production. Examples include Meta Llama 4 (https://ai.meta.com/blog/llama-4-multimodal-intelligence/?WT.mc_id=academic-105485-koreyst), some Mistral models (https://docs.mistral.ai/models/overview?WT.mc_id=academic-105485-koreyst), and many models hosted on Hugging Face (https://huggingface.co/models?WT.mc_id=academic-105485-koreyst).

Proprietary models are owned and hosted by a provider. These models are often optimized for managed production use and can offer strong support, safety systems, tool integration, and scale. However, customers usually cannot inspect or modify the model weights, and they must review provider terms for privacy, retention, compliance, and acceptable use. Examples include OpenAI models (https://platform.openai.com/docs/models?WT.mc_id=academic-105485-koreyst), Google Gemini (https://deepmind.google/models/gemini/pro/?WT.mc_id=academic-105485-koreyst), and Anthropic Claude (https://platform.claude.com/docs/en/about-claude/models/overview?WT.mc_id=academic-105485-koreyst).

### Embedding versus Image generation versus Text and Code generation

LLMs can also be categorized by the output they generate.

Embeddings are a set of models that can convert text into a numerical form, called embedding, which is a numerical representation of the input text. Embeddings make it easier for machines to understand the relationships between words or sentences and can be consumed as inputs by other models, such as classification models, or clustering models that have better performance on numerical data. Embedding models are often used for transfer learning, where a model is built for a surrogate task for which there’s an abundance of data, and then the model weights (embeddings) are re-used for other downstream tasks. An example of this category is OpenAI embeddings (https://platform.openai.com/docs/models/embeddings?WT.mc_id=academic-105485-koreyst).



Image generation models are models that generate images. These models are often used for image editing, image synthesis, and image translation. Image generation models are often trained on large datasets of images, such as LAION-5B (https://laion.ai/blog/laion-5b/?WT.mc_id=academic-105485-koreyst), and can be used to generate new images or to edit existing images with inpainting, super-resolution, and colorization techniques. Examples include GPT Image models (https://platform.openai.com/docs/guides/images?WT.mc_id=academic-105485-koreyst), Stable Diffusion models (https://github.com/Stability-AI/StableDiffusion?WT.mc_id=academic-105485-koreyst), and Imagen models.



Text and code generation models are models that generate text or code. These models are often used for text summarization, translation, and question answering. Text generation models are often trained on large datasets of text, such as BookCorpus (https://www.cv-foundation.org/openaccess/content_iccv_2015/html/Zhu_Aligning_Books_and_ICCV_2015_paper.html?WT.mc_id=academic-105485-koreyst), and can be used to generate new text, or to answer questions. Code generation models, like CodeParrot (https://huggingface.co/codeparrot?WT.mc_id=academic-105485-koreyst), are often trained on large datasets of code, such as GitHub, and can be used to generate new code, or to fix bugs in existing code.



### Encoder-Decoder versus Decoder-only

To talk about the different types of architectures of LLMs, let''s use an analogy.

Imagine your manager gave you a task for writing a quiz for the students. You have two colleagues; one oversees creating the content and the other oversees reviewing them.

The content creator is like a decoder-only model: they can look at the topic, see what you already wrote, and then continue generating content based on that context. They are very good at writing engaging and informative content, but they are not always the best choice when the task is only to classify, retrieve, or encode information. Examples of decoder-only model families include GPT and Llama models.

The reviewer is like an Encoder only model, they look at the course written and the answers, noticing the relationship between them and understanding context, but they are not good at generating content. An example of Encoder only model would be BERT.

Imagine that we can have someone as well who could create and review the quiz, this is an Encoder-Decoder model. Some examples would be BART and T5.

### Service versus Model

Now, let''s talk about the difference between a service and a model. A service is a product that is offered by a Cloud Service Provider, and is often a combination of models, data, and other components. A model is the core component of a service, and is often a foundation model, such as an LLM.

Services are often optimized for production use and are often easier to use than models, via a graphical user interface. However, services are not always available for free, and may require a subscription or payment to use, in exchange for leveraging the service owner’s equipment and resources, optimizing expenses and scaling easily. An example of a service is Azure OpenAI Service (https://learn.microsoft.com/azure/ai-foundry/openai/overview?WT.mc_id=academic-105485-koreyst), which offers a pay-as-you-go rate plan, meaning users are charged proportionally to how much they use the service. Azure OpenAI Service also offers enterprise-grade security and a responsible AI framework on top of the models'' capabilities.

Models are the neural network artifacts: parameters, weights, architecture, tokenizer, and supporting configuration. Running a model locally or in a private environment requires suitable hardware, serving infrastructure, monitoring, and either a compatible open-source/open-weight license or a commercial license. Open-weight models such as Llama 4 or Mistral models can be self-hosted, but they still require computational power and operational expertise.

## How to test and iterate with different models to understand performance on Azure

Once our team has explored the current LLMs landscape and identified some good candidates for their scenarios, the next step is testing them on their data and on their workload. This is an iterative process, done by experiments and measures.
Most of the models we mentioned in previous paragraphs (OpenAI models, open-weight models like Llama 4 and Mistral, and Hugging Face models) are available in Microsoft Foundry Models (https://learn.microsoft.com/azure/foundry/concepts/foundry-models-overview?WT.mc_id=academic-105485-koreyst).

Microsoft Foundry (https://learn.microsoft.com/azure/foundry/what-is-foundry?WT.mc_id=academic-105485-koreyst), formerly Azure AI Studio/Azure AI Foundry, is a unified Azure platform for building AI apps and agents. It helps developers manage the lifecycle from experimentation and evaluation to deployment, monitoring, and governance. The model catalog in Microsoft Foundry enables the user to:

- Find the foundation model of interest in the catalog, including models sold by Azure and models from partners and community providers. Users can filter by task, provider, license, deployment option, or name.



- Review the model card, including a detailed description of intended use and training data, code samples and evaluation results on the internal evaluations library.



- Compare benchmarks across models and datasets available in the industry to assess which one meets the business scenario, through the Model Benchmarks (https://learn.microsoft.com/azure/ai-foundry/concepts/model-benchmarks?WT.mc_id=academic-105485-koreyst) pane.



- Fine-tune supported models on custom training data to improve model performance in a specific workload, leveraging the experimentation and tracking capabilities of Microsoft Foundry.



- Deploy the original pre-trained model or the fine-tuned version to a remote real-time inference endpoint, using managed compute or serverless deployment options, to enable applications to consume it.



> [!NOTE]
> Not all models in the catalog are currently available for fine-tuning and/or pay-as-you-go deployment. Check the model card for details on the model''s capabilities and limitations.

## Improving LLM results

We’ve explored with our startup team different kinds of LLMs and a cloud platform (Microsoft Foundry) that enables us to compare different models, evaluate them on test data, improve performance, and deploy them on inference endpoints.

But when shall they consider fine-tuning a model rather than using a pre-trained one? Are there other approaches to improve model performance on specific workloads?

There are several approaches a business can use to get the results they need from an LLM. You can select different types of models with different degrees of training when deploying an LLM in production, with different levels of complexity, cost, and quality. Here are some different approaches:

- **Prompt engineering with context**. The idea is to provide enough context when you prompt to ensure you get the responses you need.

- **Retrieval Augmented Generation, RAG**. Your data might exist in a database or web endpoint for example, to ensure this data, or a subset of it, is included at the time of prompting, you can fetch the relevant data and make that part of the user''s prompt.

- **Fine-tuned model**. Here, you trained the model further on your own data which led to the model being more exact and responsive to your needs but might be costly.



Img source: Four Ways that Enterprises Deploy LLMs | Fiddler AI Blog (https://www.fiddler.ai/blog/four-ways-that-enterprises-deploy-llms?WT.mc_id=academic-105485-koreyst)

### Prompt Engineering with Context

Pre-trained LLMs work very well on generalized natural language tasks, even by calling them with a short prompt, like a sentence to complete or a question – the so-called “zero-shot” learning.

However, the more the user can frame their query, with a detailed request and examples – the Context – the more accurate and closest to user’s expectations the answer will be. In this case, we talk about “one-shot” learning if the prompt includes only one example and “few shot learning” if it includes multiple examples.
Prompt engineering with context is the most cost-effective approach to kick-off with.

### Retrieval Augmented Generation (RAG)

LLMs have the limitation that they can use only the data that has been used during their training to generate an answer. This means that they don’t know anything about the facts that happened after their training process, and they cannot access non-public information (like company data).
This can be overcome through RAG, a technique that augments prompt with external data in the form of chunks of documents, considering prompt length limits. This is supported by Vector database tools (like Azure Vector Search (https://learn.microsoft.com/azure/search/vector-search-overview?WT.mc_id=academic-105485-koreyst)) that retrieve the useful chunks from varied pre-defined data sources and add them to the prompt Context.

This technique is very helpful when a business doesn’t have enough data, enough time, or resources to fine-tune an LLM, but still wishes to improve performance on a specific workload and reduce risks of hallucinated, outdated, or unsupported answers.

### Fine-tuned model

Fine-tuning is a process that leverages transfer learning to ‘adapt’ the model to a downstream task or to solve a specific problem. Differently from few-shot learning and RAG, it results in a new model being generated, with updated weights and biases. It requires a set of training examples consisting of a single input (the prompt) and its associated output (the completion).
This would be the preferred approach if:

- **Using smaller task-specific models**. A business would like to fine-tune a smaller model for a narrow task rather than repeatedly prompt a larger frontier model, resulting in a more cost-effective and faster solution.

- **Considering latency**. Latency is important for a specific use-case, so it’s not possible to use very long prompts or the number of examples that should be learned from the model doesn’t fit with the prompt length limit.

- **Adapting stable behavior**. A business has many high-quality examples and wants the model to consistently follow a task pattern, output format, tone, or domain-specific style. If the main problem is fresh facts or private knowledge that changes often, use RAG instead of relying on fine-tuning alone.

### Trained model

Training an LLM from scratch is without a doubt the most difficult and the most complex approach to adopt, requiring massive amounts of data, skilled resources, and appropriate computational power. This option should be considered only in a scenario where a business has a domain-specific use case and a large amount of domain-centric data.

## Knowledge check

What could be a good approach to improve LLM completion results?

1. Prompt engineering with context
1. RAG
1. Fine-tuned model

A: All three can help. Start with prompt engineering and context for quick improvements, and use RAG when the model needs current facts or private business data. Choose fine-tuning when you have enough high-quality examples and need the model to consistently follow a task, format, tone, or domain pattern.

## 🚀 Challenge

Read up more on how you can use RAG (https://learn.microsoft.com/azure/search/retrieval-augmented-generation-overview?WT.mc_id=academic-105485-koreyst) for your business.

## Great Work, Continue Your Learning

After completing this lesson, check out our Generative AI Learning collection (https://aka.ms/genai-collection?WT.mc_id=academic-105485-koreyst) to continue leveling up your Generative AI knowledge!

Head over to Lesson 3 where we will look at how to build with Generative AI Responsibly (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/03-using-generative-ai-responsibly/README.md?WT.mc_id=academic-105485-koreyst)!',14);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'generative-ai-foundations-3','Using Generative AI Responsibly',3,'# Using Generative AI Responsibly

[](https://youtu.be/YOp-e1GjZdA?si=7Wv4wu3x44L1DCVj)

> _Click the image above to view video of this lesson_

It''s easy to be fascinated with AI and generative AI in particular, but you need to consider how you would use it responsibly. You need to consider things like how to ensure the output is fair, non-harmful and more. This chapter aims to provide you with the mentioned context, what to consider, and how to take active steps to improve your AI usage.

## Introduction

This lesson will cover:

- Why you should prioritize Responsible AI when building Generative AI applications.
- Core principles of Responsible AI and how they relate to Generative AI.
- How to put these Responsible AI principles into practice through strategy and tooling.

## Learning Goals

After completing this lesson you will know:

- The importance of Responsible AI when building Generative AI applications.
- When to think and apply the core principles of Responsible AI when building Generative AI applications.
- What tools and strategies are available to you to put the concept of Responsible AI into practice.

## Responsible AI Principles

The excitement of Generative AI has never been higher. This excitement has brought a lot of new developers, attention, and funding to this space. While this is very positive for anyone looking to build products and companies using Generative AI, it is also important we proceed responsibly.

Throughout this course, we are focusing on building our startup and our AI education product. We’ll use the principles of Responsible AI: Fairness, Inclusiveness, Reliability/Safety, Security & Privacy, Transparency and Accountability. With these principles, we will explore how they relate to our use of Generative AI in our products.

## Why Should You Prioritize Responsible AI

When building a product, taking a human-centric approach by keeping your user''s best interest in mind leads to the best results.

The uniqueness of Generative AI is its power to create helpful answers, information, guidance, and content for users. This can be done without many manual steps which can lead to very impressive results. Without proper planning and strategies, it can also unfortunately lead to some harmful results for your users, your product, and society as a whole.

Let''s look at some (but not all) of these potentially harmful results:

### Hallucinations

Hallucinations are a term used to describe when an LLM produces content that is either completely nonsensical or something we know is factually wrong based on other sources of information.

Let''s take for example we build a feature for our startup that allows students to ask historical questions to a model. A student asks the question `Who was the sole survivor of Titanic?`

The model produces a response such as the one below:



> _(Source: Flying bisons (https://flyingbisons.com/?WT.mc_id=academic-105485-koreyst))_

This is a very confident and thorough answer. Unfortunately, it is incorrect. Even with a minimal amount of research, one would discover there was more than one survivor of the Titanic disaster. For a student who is just starting to research this topic, this answer can be persuasive enough to not be questioned and treated as fact. The consequences of this can lead to the AI system being unreliable and negatively impact the reputation of our startup.

With each iteration of any given LLM, we have seen performance improvements around minimizing hallucinations. Even with this improvement, we as application builders and users still need to remain aware of these limitations.

### Harmful Content

We covered in the earlier section when an LLM produces incorrect or nonsensical responses. Another risk we need to be aware of is when a model responds with harmful content.

Harmful content can be defined as:

- Providing instructions or encouraging self-harm or harm to certain groups.
- Hateful or demeaning content.
- Guiding the planning of any type of attack or violent acts.
- Providing instructions on how to find illegal content or commit illegal acts.
- Displaying sexually explicit content.

For our startup, we want to make sure we have the right tools and strategies in place to prevent this type of content from being seen by students.

### Lack of Fairness

Fairness is defined as “ensuring that an AI system is free from bias and discrimination and that they treat everyone fairly and equally.” In the world of Generative AI, we want to ensure that exclusionary worldviews of marginalized groups are not reinforced by the model’s output.

These types of outputs are not only destructive to building positive product experiences for our users, but they also cause further societal harm. As application builders, we should always keep a wide and diverse user base in mind when building solutions with Generative AI.

## How to Use Generative AI Responsibly

Now that we have identified the importance of Responsible Generative AI, let''s look at 4 steps we can take to build our AI solutions responsibly:



### Measure Potential Harms

In software testing, we test the expected actions of a user on an application. Similarly, testing a diverse set of prompts users are most likely going to use is a good way to measure potential harm.

Since our startup is building an education product, it would be good to prepare a list of education-related prompts. This could be to cover a certain subject, historical facts, and prompts about student life.

### Mitigate Potential Harms

It is now time to find ways where we can prevent or limit the potential harm caused by the model and its responses. We can look at this in 4 different layers:



- **Model**. Choosing the right model for the right use case. Larger and more complex models like GPT-4 can cause more of a risk of harmful content when applied to smaller and more specific use cases. Using your training data to fine-tune also reduces the risk of harmful content.

- **Safety System**. A safety system is a set of tools and configurations on the platform serving the model that help mitigate harm. An example of this is the content filtering system on the Azure OpenAI service. Systems should also detect jailbreak attacks and unwanted activity like requests from bots.

- **Metaprompt**. Metaprompts and grounding are ways we can direct or limit the model based on certain behaviors and information. This could be using system inputs to define certain limits of the model. In addition, providing outputs that are more relevant to the scope or domain of the system.

It can also be using techniques like Retrieval Augmented Generation (RAG) to have the model only pull information from a selection of trusted sources. There is a lesson later in this course for building search applications (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/08-building-search-applications/README.md?WT.mc_id=academic-105485-koreyst)

- **User Experience**. The final layer is where the user interacts directly with the model through our application’s interface in some way. In this way we can design the UI/UX to limit the user on the types of inputs they can send to the model as well as text or images displayed to the user. When deploying the AI application, we also must be transparent about what our Generative AI application can and can’t do.

We have an entire lesson dedicated to Designing UX for AI Applications (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/12-designing-ux-for-ai-applications/README.md?WT.mc_id=academic-105485-koreyst)

- **Evaluate model**. Working with LLMs can be challenging because we don’t always have control over the data the model was trained on. Regardless, we should always evaluate the model’s performance and outputs. It’s still important to measure the model’s accuracy, similarity, groundedness, and relevance of the output. This helps provide transparency and trust to stakeholders and users.

### Operate a Responsible Generative AI solution

Building an operational practice around your AI applications is the final stage. This includes partnering with other parts of our startup like Legal and Security to ensure we are compliant with all regulatory policies. Before launching, we also want to build plans around delivery, handling incidents, and rollback to prevent any harm to our users from growing.

## Tools

While the work of developing Responsible AI solutions may seem like a lot, it is work well worth the effort. As the area of Generative AI grows, more tooling to help developers efficiently integrate responsibility into their workflows will mature. For example, the Azure AI Content Safety (https://learn.microsoft.com/azure/ai-services/content-safety/overview?WT.mc_id=academic-105485-koreyst) can help detect harmful content and images via an API request.

## Knowledge check

What are some things you need to care about to ensure responsible AI usage?

1. That the answer is correct.
1. Harmful usage, that AI isn''t used for criminal purposes.
1. Ensuring the AI is free from bias and discrimination.

A: 2 and 3 are correct. Responsible AI helps you consider how to mitigate harmful effects and biases and more.

## 🚀 Challenge

Read up on Azure AI Content Safety (https://learn.microsoft.com/azure/ai-services/content-safety/overview?WT.mc_id=academic-105485-koreyst) and see what you can adopt for your usage.

## Great Work, Continue Your Learning

After completing this lesson, check out our Generative AI Learning collection (https://aka.ms/genai-collection?WT.mc_id=academic-105485-koreyst) to continue leveling up your Generative AI knowledge!

Head over to Lesson 4 where we will look at Prompt Engineering Fundamentals (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/04-prompt-engineering-fundamentals/README.md?WT.mc_id=academic-105485-koreyst)!',8);
insert into public.chapters(book_id,slug,title,chapter_number,content,est_minutes) values(b,'generative-ai-foundations-4','Prompt Engineering Fundamentals',4,'# Prompt Engineering Fundamentals

[](https://youtu.be/GElCu2kUlRs?si=qrXsBvXnCW12epb8)

## Introduction
This module covers essential concepts and techniques for creating effective prompts in generative AI models. The way you write your prompt to an LLM also matters. A carefully-crafted prompt can achieve a better quality of response. But what exactly do terms like _prompt_ and _prompt engineering_ mean? And how do I improve the prompt _input_ that I send to the LLM? These are the questions we''ll try to answer within this chapter and the next.

_Generative AI_ is capable of creating new content (e.g., text, images, audio, code etc.) in response to user requests. It achieves this using _Large Language Models_ like OpenAI''s GPT ("Generative Pre-trained Transformer") series that are trained for using natural language and code.

Users can now interact with these models using familiar paradigms like chat, without needing any technical expertise or training. The models are _prompt-based_ - users send a text input (prompt) and get back the AI response (completion). They can then "chat with the AI" iteratively, in multi-turn conversations, refining their prompt until the response matches their expectations.

"Prompts" now become the primary _programming interface_ for generative AI apps, telling the models what to do and influencing the quality of returned responses. "Prompt Engineering" is a fast-growing field of study that focuses on the _design and optimization_ of prompts to deliver consistent and quality responses at scale.

## Learning Goals

In this lesson, we learn what Prompt Engineering is, why it matters, and how we can craft more effective prompts for a given model and application objective. We''ll understand core concepts and best practices for prompt engineering - and learn about an interactive Jupyter Notebooks "sandbox" environment where we can see these concepts applied to real examples.

By the end of this lesson we will be able to:

1. Explain what prompt engineering is and why it matters.
2. Describe the components of a prompt and how they are used.
3. Learn best practices and techniques for prompt engineering.
4. Apply learned techniques to real examples, using an OpenAI endpoint.

## Key Terms

Prompt Engineering: The practice of designing and refining inputs to guide AI models toward producing desired outputs.
Tokenization: The process of converting text into smaller units, called tokens, that a model can understand and process.
Instruction-Tuned LLMs: Large Language Models (LLMs) that have been fine-tuned with specific instructions to improve their response accuracy and relevance.

## Learning Sandbox

Prompt engineering is currently more art than science. The best way to improve our intuition for it is to _practice more_ and adopt a trial-and-error approach that combines application domain expertise with recommended techniques and model-specific optimizations.

The Jupyter Notebook accompanying this lesson provides a _sandbox_ environment where you can try out what you learn - as you go or as part of the code challenge at the end. To execute the exercises, you will need:

1. **An Azure OpenAI API key** - the service endpoint for a deployed LLM.
2. **A Python Runtime** - in which the Notebook can be executed.
3. **Local Env Variables** - _complete the SETUP (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/00-course-setup/02-setup-local.md?WT.mc_id=academic-105485-koreyst) steps now to get ready_.

The notebook comes with _starter_ exercises - but you are encouraged to add your own _Markdown_ (description) and _Code_ (prompt requests) sections to try out more examples or ideas - and build your intuition for prompt design.

## Illustrated Guide

Want to get the big picture of what this lesson covers before you dive in? Check out this illustrated guide, which gives you a sense of the main topics covered and the key takeaways for you to think about in each one. The lesson roadmap takes you from understanding the core concepts and challenges to addressing them with relevant prompt engineering techniques and best practices. Note that the "Advanced Techniques" section in this guide refers to content covered in the _next_ chapter of this curriculum.



## Our Startup

Now, let''s talk about how _this topic_ relates to our startup mission to bring AI innovation to education (https://educationblog.microsoft.com/2023/06/collaborating-to-bring-ai-innovation-to-education?WT.mc_id=academic-105485-koreyst). We want to build AI-powered applications of _personalized learning_ - so let''s think about how different users of our application might "design" prompts:

- **Administrators** might ask the AI to _analyze curriculum data to identify gaps in coverage_. The AI can summarize results or visualize them with code.
- **Educators** might ask the AI to _generate a lesson plan for a target audience and topic_. The AI can build the personalized plan in a specified format.
- **Students** might ask the AI to _tutor them in a difficult subject_. The AI can now guide students with lessons, hints & examples tailored to their level.

That''s just the tip of the iceberg. Check out Prompts For Education (https://github.com/microsoft/prompts-for-edu/tree/main?WT.mc_id=academic-105485-koreyst) - an open-source prompts library curated by education experts - to get a broader sense of the possibilities! _Try running some of those prompts in the sandbox or using the OpenAI Playground to see what happens!_



## What is Prompt Engineering?

We started this lesson by defining **Prompt Engineering** as the process of _designing and optimizing_ text inputs (prompts) to deliver consistent and quality responses (completions) for a given application objective and model. We can think of this as a 2-step process:

- _designing_ the initial prompt for a given model and objective
- _refining_ the prompt iteratively to improve the quality of the response

This is necessarily a trial-and-error process that requires user intuition and effort to get optimal results. So why is it important? To answer that question, we first need to understand three concepts:

- _Tokenization_ = how the model "sees" the prompt
- _Base LLMs_ = how the foundation model "processes" a prompt
- _Instruction-Tuned LLMs_ = how the model can now see "tasks"

### Tokenization

An LLM sees prompts as a _sequence of tokens_ where different models (or versions of a model) can tokenize the same prompt in different ways. Since LLMs are trained on tokens (and not on raw text), the way prompts get tokenized has a direct impact on the quality of the generated response.

To get an intuition for how tokenization works, try tools like the OpenAI Tokenizer (https://platform.openai.com/tokenizer?WT.mc_id=academic-105485-koreyst) shown below. Copy in your prompt - and see how that gets converted into tokens, paying attention to how whitespace characters and punctuation marks are handled. Note that this example shows an older LLM (GPT-3) - so trying this with a newer model may produce a different result.



### Concept: Foundation Models

Once a prompt is tokenized, the primary function of the "Base LLM" (https://blog.gopenai.com/an-introduction-to-base-and-instruction-tuned-large-language-models-8de102c785a6?WT.mc_id=academic-105485-koreyst) (or Foundation model) is to predict the token in that sequence. Since LLMs are trained on massive text datasets, they have a good sense of the statistical relationships between tokens and can make that prediction with some confidence. Note that they don''t understand the _meaning_ of the words in the prompt or token; they just see a pattern they can "complete" with their next prediction. They can continue predicting the sequence till terminated by user intervention or some pre-established condition.

Want to see how prompt-based completion works? Enter the above prompt into the Microsoft Foundry playground (https://ai.azure.com/?WT.mc_id=academic-105485-koreyst) with the default settings. The system is configured to treat prompts as requests for information - so you should see a completion that satisfies this context.

But what if the user wanted to see something specific that met some criteria or task objective? This is where _instruction-tuned_ LLMs come into the picture.



### Concept: Instruction Tuned LLMs

An Instruction Tuned LLM (https://blog.gopenai.com/an-introduction-to-base-and-instruction-tuned-large-language-models-8de102c785a6?WT.mc_id=academic-105485-koreyst) starts with the foundation model and fine-tunes it with examples or input/output pairs (e.g., multi-turn "messages") that can contain clear instructions - and the response from the AI attempt to follow that instruction.

This uses techniques like Reinforcement Learning with Human Feedback (RLHF) that can train the model to _follow instructions_ and _learn from feedback_ so that it produces responses that are better-suited to practical applications and more relevant to user objectives.

Let''s try it out - revisit the prompt above, but now change the _system message_ to provide the following instruction as context:

> _Summarize content you are provided with for a second-grade student. Keep the result to one paragraph with 3-5 bullet points._

See how the result is now tuned to reflect the desired goal and format? An educator can now directly use this response in their slides for that class.



## Why do we need Prompt Engineering?

Now that we know how prompts are processed by LLMs, let''s talk about _why_ we need prompt engineering. The answer lies in the fact that current LLMs pose a number of challenges that make _reliable and consistent completions_ more challenging to achieve without putting effort into prompt construction and optimization. For instance:

1. **Model responses are stochastic.** The _same prompt_ will likely produce different responses with different models or model versions. And it may even produce different results with the _same model_ at different times. _Prompt engineering techniques can help us minimize these variations by providing better guardrails_.

1. **Models can fabricate responses.** Models are pre-trained with _large but finite_ datasets, meaning they lack knowledge about concepts outside that training scope. As a result, they can produce completions that are inaccurate, imaginary, or directly contradictory to known facts. _Prompt engineering techniques help users identify and mitigate such fabrications e.g., by asking AI for citations or reasoning_.

1. **Models capabilities will vary.** Newer models or model generations will have richer capabilities but also bring unique quirks and tradeoffs in cost & complexity. _Prompt engineering can help us develop best practices and workflows that abstract away differences and adapt to model-specific requirements in scalable, seamless ways_.

Let''s see this in action in the OpenAI or Azure OpenAI Playground:

- Use the same prompt with different LLM deployments (e.g, OpenAI, Azure OpenAI, Hugging Face) - did you see the variations?
- Use the same prompt repeatedly with the _same_ LLM deployment (e.g., Azure OpenAI playground) - how did these variations differ?

### Fabrications Example

In this course, we use the term **"fabrication"** to reference the phenomenon where LLMs sometimes generate factually incorrect information due to limitations in their training or other constraints. You may also have heard this referred to as _"hallucinations"_ in popular articles or research papers. However, we strongly recommend using _"fabrication"_ as the term so we don''t accidentally anthropomorphize the behavior by attributing a human-like trait to a machine-driven outcome. This also reinforces Responsible AI guidelines (https://www.microsoft.com/ai/responsible-ai?WT.mc_id=academic-105485-koreyst) from a terminology perspective, removing terms that may also be considered offensive or non-inclusive in some contexts.

Want to get a sense of how fabrications work? Think of a prompt that instructs the AI to generate content for a non-existent topic (to ensure it is not found in the training dataset). For example - I tried this prompt:

> **Prompt:** generate a lesson plan on the Martian War of 2076.

A web search showed me that there were fictional accounts (e.g., television series or books) on Martian wars - but none in 2076. Commonsense also tells us that 2076 is _in the future_ and thus, cannot be associated with a real event.

So what happens when we run this prompt with different LLM providers?

> **Response 1**: OpenAI Playground (GPT-35)



> **Response 2**: Azure OpenAI Playground (GPT-35)



> **Response 3**: : Hugging Face Chat Playground (LLama-2)



As expected, each model (or model version) produces slightly different responses thanks to stochastic behavior and model capability variations. For instance, one model targets an 8th grade audience while the other assumes a high-school student. But all three models did generate responses that could convince an uninformed user that the event was real.

Prompt engineering techniques like _metaprompting_ and _temperature configuration_ may reduce model fabrications to some extent. New prompt engineering _architectures_ also incorporate new tools and techniques seamlessly into the prompt flow, to mitigate or reduce some of these effects.

## Case Study: GitHub Copilot

Let''s wrap this section by getting a sense of how prompt engineering is used in real-world solutions by looking at one Case Study: GitHub Copilot (https://github.com/features/copilot?WT.mc_id=academic-105485-koreyst).

GitHub Copilot is your "AI Pair Programmer" - it converts text prompts into code completions and is integrated into your development environment (e.g., Visual Studio Code) for a seamless user experience. As documented in the series of blogs below, the earliest version was based on the OpenAI Codex model - with engineers quickly realizing the need to fine-tune the model and develop better prompt engineering techniques, to improve code quality. In July, they debuted an improved AI model that goes beyond Codex (https://github.blog/2023-07-28-smarter-more-efficient-coding-github-copilot-goes-beyond-codex-with-improved-ai-model/?WT.mc_id=academic-105485-koreyst) for even faster suggestions.

Read the posts in order, to follow their learning journey.

- **May 2023** | GitHub Copilot is Getting Better at Understanding Your Code (https://github.blog/2023-05-17-how-github-copilot-is-getting-better-at-understanding-your-code/?WT.mc_id=academic-105485-koreyst)
- **May 2023** | Inside GitHub: Working with the LLMs behind GitHub Copilot (https://github.blog/2023-05-17-inside-github-working-with-the-llms-behind-github-copilot/?WT.mc_id=academic-105485-koreyst).
- **Jun 2023** | How to write better prompts for GitHub Copilot (https://github.blog/2023-06-20-how-to-write-better-prompts-for-github-copilot/?WT.mc_id=academic-105485-koreyst).
- **Jul 2023** | .. GitHub Copilot goes beyond Codex with improved AI model (https://github.blog/2023-07-28-smarter-more-efficient-coding-github-copilot-goes-beyond-codex-with-improved-ai-model/?WT.mc_id=academic-105485-koreyst)
- **Jul 2023** | A Developer''s Guide to Prompt Engineering and LLMs (https://github.blog/2023-07-17-prompt-engineering-guide-generative-ai-llms/?WT.mc_id=academic-105485-koreyst)
- **Sep 2023** | How to build an enterprise LLM app: Lessons from GitHub Copilot (https://github.blog/2023-09-06-how-to-build-an-enterprise-llm-application-lessons-from-github-copilot/?WT.mc_id=academic-105485-koreyst)

You can also browse their Engineering blog (https://github.blog/category/engineering/?WT.mc_id=academic-105485-koreyst) for more posts like this one (https://github.blog/2023-09-27-how-i-used-github-copilot-chat-to-build-a-reactjs-gallery-prototype/?WT.mc_id=academic-105485-koreyst) that shows how these models and techniques are _applied_ for driving real-world applications.

---



## Prompt Construction

We''ve seen why prompt engineering is important - now let''s understand how prompts are _constructed_ so we can evaluate different techniques for more effective prompt design.

### Basic Prompt

Let''s start with the basic prompt: a text input sent to the model with no other context. Here''s an example - when we send the first few words of the US national anthem to the OpenAI Completion API (https://platform.openai.com/docs/api-reference/completions?WT.mc_id=academic-105485-koreyst) it instantly _completes_ the response with the next few lines, illustrating the basic prediction behavior.

| Prompt (Input)     | Completion (Output)                                                                                                                        |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| Oh say can you see | It sounds like you''re starting the lyrics to "The Star-Spangled Banner," the national anthem of the United States. The full lyrics are ... |

### Complex Prompt

Now let''s add context and instructions to that basic prompt. The Chat Completion API (https://learn.microsoft.com/azure/ai-foundry/openai/how-to/chatgpt?WT.mc_id=academic-105485-koreyst) lets us construct a complex prompt as a collection of _messages_ with:

- Input/output pairs reflecting _user_ input and _assistant_ response.
- System message setting the context for assistant behavior or personality.

The request is now in the form below, where the _tokenization_ effectively captures relevant information from context and conversation. Now, changing the system context can be as impactful on the quality of completions, as the user inputs provided.

```python
response = client.responses.create(
    model="gpt-5-mini",
    input=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Who won the world series in 2020?"},
        {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
        {"role": "user", "content": "Where was it played?"}
    ]
)
```

### Instruction Prompt

In the above examples, the user prompt was a simple text query that can be interpreted as a request for information. With _instruction_ prompts, we can use that text to specify a task in more detail, providing better guidance to the AI. Here''s an example:

| Prompt (Input)                                                                                                                                                                                                                         | Completion (Output)                                                                                                        | Instruction Type    |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| Write a description of the Civil War                                                                                                                                                                                                   | _returned a simple paragraph_                                                                                              | Simple              |
| Write a description of the Civil War. Provide key dates and events and describe their significance                                                                                                                                     | _returned a paragraph followed by a list of key event dates with descriptions_                                             | Complex             |
| Write a description of the Civil War in 1 paragraph. Provide 3 bullet points with key dates and their significance. Provide 3 more bullet points with key historical figures and their contributions. Return the output as a JSON file | _returns more extensive details in a text box, formatted as JSON that you can copy-paste to a file and validate as needed_ | Complex. Formatted. |

## Primary Content

In the above examples, the prompt was still fairly open-ended, allowing the LLM to decide what part of its pre-trained dataset was relevant. With the _primary content_ design pattern, the input text is divided into two parts:

- an instruction (action)
- relevant content (that influences action)

Here''s an example where the instruction is to "summarize this in 2 sentences".

| Prompt (Input)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Completion (Output)                                                                                                                                                                                                                                                                             |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined. Jupiter is one of the brightest objects visible to the naked eye in the night sky, and has been known to ancient civilizations since before recorded history. It is named after the Roman god Jupiter.[19] When viewed from Earth, Jupiter can be bright enough for its reflected light to cast visible shadows,[20] and is on average the third-brightest natural object in the night sky after the Moon and Venus.  **Summarize this in 2 short sentences** | Jupiter, the fifth planet from the Sun, is the largest in the Solar System and is known for being one of the brightest objects in the night sky. Named after the Roman god Jupiter, it''s a gas giant whose mass is two-and-a-half times that of all other planets in the Solar System combined. |

The primary content segment can be used in various ways to drive more effective instructions:

- **Examples** - instead of telling the model what to do with an explicit instruction, give it examples of what to do and let it infer the pattern.
- **Cues** - follow the instruction with a "cue" that primes the completion, guiding the model towards more relevant responses.
- **Templates** - these are repeatable ''recipes'' for prompts with placeholders (variables) that can be customized with data for specific use cases.

Let''s explore these in action.

### Using Examples

This is an approach where you use the primary content to "feed the model" some examples of the desired output for a given instruction, and let it infer the pattern for the desired output. Based on the number of examples provided, we can have zero-shot prompting, one-shot prompting, few-shot prompting etc.

The prompt now consists of three components:

- A task description
- A few examples of the desired output
- The start of a new example (which becomes an implicit task description)

| Learning Type | Prompt (Input)                                                                                                                                        | Completion (Output)         |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| Zero-shot     | "The Sun is Shining". Translate to Spanish                                                                                                            | "El Sol está brillando".    |
| One-shot      | "The Sun is Shining" => ""El Sol está brillando".  "It''s a Cold and Windy Day" =>                                                                 | "Es un día frío y ventoso". |
| Few-shot      | The player ran the bases => Baseball  The player hit an ace => Tennis  The player hit a six => Cricket  The player made a slam-dunk => | Basketball                  |
|               |                                                                                                                                                       |                             |

Note how we had to provide explicit instruction ("Translate to Spanish") in zero-shot prompting, but it gets inferred in the one-shot prompting example. The few-shot example shows how adding more examples allows models to make more accurate inferences with no added instructions.

### Prompt Cues

Another technique for using primary content is to provide _cues_ rather than examples. In this case, we are giving the model a nudge in the right direction by _starting it off_ with a snippet that reflects the desired response format. The model then "takes the cue" to continue in that vein.

| Number of Cues | Prompt (Input)                                                                                                                                                                                                                                                                                                                                                                                                                                               | Completion (Output)                                                                                                                                                                                                                                                                                       |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0              | Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined. Jupiter is one of the brightest objects visible to the naked eye in the night sky, and has been known to ancient civilizations since before recorded history. **Summarize This**                                       | Jupiter is the largest planet in our Solar System and the fifth one from the Sun. It is a gas giant with a mass 1/1000th of the Sun''s, but it is heavier than all the other planets combined. Ancient civilizations have known about Jupiter for a long time, and it is easily visible in the night sky.. |
| 1              | Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined. Jupiter is one of the brightest objects visible to the naked eye in the night sky, and has been known to ancient civilizations since before recorded history. **Summarize This**  What we learned is that Jupiter | is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets combined. It is easily visible to the naked eye and has been known since ancient times.                        |
| 2              | Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined. Jupiter is one of the brightest objects visible to the naked eye in the night sky, and has been known to ancient civilizations since before recorded history. **Summarize This**  Top 3 Facts We Learned:         | 1. Jupiter is the fifth planet from the Sun and the largest in the Solar System.  2. It is a gas giant with a mass one-thousandth that of the Sun... 3. Jupiter has been visible to the naked eye since ancient times ...                                                                       |
|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                                                                                                                           |

### Prompt Templates

A prompt template is a _pre-defined recipe for a prompt_ that can be stored and reused as needed, to drive more consistent user experiences at scale. In its simplest form, it is simply a collection of prompt examples like this one from OpenAI (https://cookbook.openai.com/examples/gpt4-1_prompting_guide?WT.mc_id=academic-105485-koreyst) that provides both the interactive prompt components (user and system messages) and the API-driven request format - to support reuse.

In its more complex form like this example from LangChain (https://python.langchain.com/docs/concepts/prompt_templates/?WT.mc_id=academic-105485-koreyst) it contains _placeholders_ that can be replaced with data from a variety of sources (user input, system context, external data sources etc.) to generate a prompt dynamically. This allows us to create a library of reusable prompts that can be used to drive consistent user experiences **programmatically** at scale.

Finally, the real value of templates lies in the ability to create and publish _prompt libraries_ for vertical application domains - where the prompt template is now _optimized_ to reflect application-specific context or examples that make the responses more relevant and accurate for the targeted user audience. The Prompts For Edu (https://github.com/microsoft/prompts-for-edu?WT.mc_id=academic-105485-koreyst) repository is a great example of this approach, curating a library of prompts for the education domain with emphasis on key objectives like lesson planning, curriculum design, student tutoring etc.

## Supporting Content

If we think about prompt construction as having a instruction (task) and a target (primary content), then _secondary content_ is like additional context we provide to **influence the output in some way**. It could be tuning parameters, formatting instructions, topic taxonomies etc. that can help the model _tailor_ its response to be suit the desired user objectives or expectations.

For example: Given a course catalog with extensive metadata (name, description, level, metadata tags, instructor etc.) on all the available courses in the curriculum:

- we can define an instruction to "summarize the course catalog for Fall 2023"
- we can use the primary content to provide a few examples of the desired output
- we can use the secondary content to identify the top 5 "tags" of interest.

Now, the model can provide a summary in the format shown by the few examples - but if a result has multiple tags, it can prioritize the 5 tags identified in secondary content.

---



## Prompting Best Practices

Now that we know how prompts can be _constructed_, we can start thinking about how to _design_ them to reflect best practices. We can think about this in two parts - having the right _mindset_ and applying the right _techniques_.

### Prompt Engineering Mindset

Prompt Engineering is a trial-and-error process so keep three broad guiding factors in mind:

1. **Domain Understanding Matters.** Response accuracy and relevance is a function of the _domain_ in which that application or user operates. Apply your intuition and domain expertise to **customize techniques** further. For instance, define _domain-specific personalities_ in your system prompts, or use _domain-specific templates_ in your user prompts. Provide secondary content that reflects domain-specific contexts, or use _domain-specific cues and examples_ to guide the model towards familiar usage patterns.

2. **Model Understanding Matters.** We know models are stochastic by nature. But model implementations can also vary in terms of the training dataset they use (pre-trained knowledge), the capabilities they provide (e.g., via API or SDK) and the type of content they are optimized for (e.g, code vs. images vs. text). Understand the strengths and limitations of the model you are using, and use that knowledge to _prioritize tasks_ or build _customized templates_ that are optimized for the model''s capabilities.

3. **Iteration & Validation Matters.** Models are evolving rapidly, and so are the techniques for prompt engineering. As a domain expert, you may have other context or criteria _your_ specific application, that may not apply to the broader community. Use prompt engineering tools & techniques to "jump start" prompt construction, then iterate and validate the results using your own intuition and domain expertise. Record your insights and create a **knowledge base** (e.g, prompt libraries) that can be used as a new baseline by others, for faster iterations in the future.

## Best Practices

Now let''s look at common best practices that are recommended by OpenAI (https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-openai-api?WT.mc_id=academic-105485-koreyst) and Azure OpenAI (https://learn.microsoft.com/azure/ai-foundry/openai/concepts/prompt-engineering#best-practices?WT.mc_id=academic-105485-koreyst) practitioners.

| What                              | Why                                                                                                                                                                                                                                               |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Evaluate the latest models.       | New model generations are likely to have improved features and quality - but may also incur higher costs. Evaluate them for impact, then make migration decisions.                                                                                |
| Separate instructions & context   | Check if your model/provider defines _delimiters_ to distinguish instructions, primary and secondary content more clearly. This can help models assign weights more accurately to tokens.                                                         |
| Be specific and clear             | Give more details about the desired context, outcome, length, format, style etc. This will improve both the quality and consistency of responses. Capture recipes in reusable templates.                                                          |
| Be descriptive, use examples      | Models may respond better to a "show and tell" approach. Start with a `zero-shot` approach where you give it an instruction (but no examples) then try `few-shot` as a refinement, providing a few examples of the desired output. Use analogies. |
| Use cues to jumpstart completions | Nudge it towards a desired outcome by giving it some leading words or phrases that it can use as a starting point for the response.                                                                                                               |
| Double Down                       | Sometimes you may need to repeat yourself to the model. Give instructions before and after your primary content, use an instruction and a cue, etc. Iterate & validate to see what works.                                                         |
| Order Matters                     | The order in which you present information to the model may impact the output, even in the learning examples, thanks to recency bias. Try different options to see what works best.                                                               |
| Give the model an “out”           | Give the model a _fallback_ completion response it can provide if it cannot complete the task for any reason. This can reduce chances of models generating false or fabricated responses.                                                         |
|                                   |                                                                                                                                                                                                                                                   |

As with any best practice, remember that _your mileage may vary_ based on the model, the task and the domain. Use these as a starting point, and iterate to find what works best for you. Constantly re-evaluate your prompt engineering process as new models and tools become available, with a focus on process scalability and response quality.



## Assignment

Congratulations! You made it to the end of the lesson! It''s time to put some of those concepts and techniques to the test with real examples!

For our assignment, we''ll be using a Jupyter Notebook with exercises you can complete interactively. You can also extend the Notebook with your own Markdown and Code cells to explore ideas and techniques on your own.

### To get started, fork the repo, then

- (Recommended) Launch GitHub Codespaces
- (Alternatively) Clone the repo to your local device and use it with Docker Desktop
- (Alternatively) Open the Notebook with your preferred Notebook runtime environment.

### Next, configure your environment variables

- Copy the `.env.copy` file in repo root to `.env` and fill in the `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_DEPLOYMENT` values. Come back to Learning Sandbox section (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/04-prompt-engineering-fundamentals/README.md#learning-sandbox) to learn how.

### Next, open the Jupyter Notebook

- Select the runtime kernel. If using options 1 or 2, simply select the default Python 3.10.x kernel provided by the dev container.

You''re all set to run the exercises. Note that there are no _right and wrong_ answers here - just exploring options by trial-and-error and building intuition for what works for a given model and application domain.

_For this reason there are no Code Solution segments in this lesson. Instead, the Notebook will have Markdown cells titled "My Solution:" that shows one example output for reference._

 

## Knowledge check

Which of the following is a good prompt following some reasonable best practices?

1. Show me an image of red car
2. Show me an image of red car of make Volvo and model XC90 parked by a cliff with the sun setting
3. Show me an image of red car of make Volvo and model XC90

A: 2, it''s the best prompt as it provides details on "what" and goes into specifics (not just any car but a specific make and model) and it also describes the overall setting. 3 is next best as it also contains a lot of description.

## 🚀 Challenge

See if you can leverage the "cue" technique with the prompt: Complete the sentence "Show me an image of red car of make Volvo and ". What does it respond with, and how would you improve it?

## Great Work! Continue Your Learning

Want to learn more about different Prompt Engineering concepts? Go to the continued learning page (https://aka.ms/genai-collection?WT.mc_id=academic-105485-koreyst) to find other great resources on this topic.

Head over to Lesson 5 where we will look at advanced prompting techniques (https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/d8ec07e31c4b32bd283d565c1abd9b58bb5cf2e8/05-advanced-prompts/README.md?WT.mc_id=academic-105485-koreyst)!',26);
update public.books set status='APPROVED',published_at=now() where id=b;end if;
end $seed$;
