/**
 * Создает HTML-форму, связанную с JavaScript-объектом.
 * Значения в объекте изменяются сразу после изменения формы.
 *
 * @param {Object} obj - Объект с булевыми значениями, строками, целыми числами и массивами строк
 * @param document
 * @returns {HTMLElement} - HTML-форма
 */
export default function createFormBinder(obj, document) {
    // Создаем элемент формы
    const form = document.createElement("form");
    form.className = "formbinder-form";

    // Сначала определяем, какие поля имеют парные значения (с суффиксом s и без)
    const pairedFields = new Set();
    for (const key in obj) {
        if (key.endsWith("s") && Array.isArray(obj[key])) {
            const baseKey = key.slice(0, -1);
            if (baseKey in obj) {
                pairedFields.add(baseKey);
            }
        }
    }

    // Проходим по всем свойствам объекта
    for (const key in obj) {
        const value = obj[key];
        const type = typeof value;

        // Пропускаем поля без суффикса, если есть парное поле с суффиксом
        if (pairedFields.has(key)) {
            continue;
        }

        // Создаем контейнер для элемента управления
        const div = document.createElement("div");
        div.className = "formbinder-field-container";

        // Создаем метку для элемента управления
        const label = document.createElement("label");
        label.htmlFor = key;
        label.textContent = key + ": ";
        label.className = "formbinder-label";

        if (type === "boolean") {
            // Создаем чекбокс для булевых значений
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = key;
            checkbox.checked = value;

            // Добавляем обработчик события изменения чекбокса
            checkbox.addEventListener("change", () => {
                obj[key] = checkbox.checked;
            });

            // Добавляем элементы в контейнер
            div.appendChild(label);
            div.appendChild(checkbox);
        } else if (type === "string") {
            // Создаем текстовое поле для строк
            const input = document.createElement("input");
            input.type = "text";
            input.id = key;
            input.value = value;

            // Добавляем обработчик события изменения текстового поля
            input.addEventListener("input", () => {
                obj[key] = input.value;
            });

            // Добавляем элементы в контейнер
            div.appendChild(label);
            div.appendChild(input);
        } else if (type === "number" && Number.isInteger(value)) {
            // Создаем текстовое поле для целых чисел
            const input = document.createElement("input");
            input.type = "number";
            input.id = key;
            input.value = value;

            // Добавляем обработчик события изменения числового поля
            input.addEventListener("input", () => {
                const numValue = parseInt(input.value, 10);
                if (!isNaN(numValue)) {
                    obj[key] = numValue;
                }
            });

            // Добавляем элементы в контейнер
            div.appendChild(label);
            div.appendChild(input);
        } else if (Array.isArray(value) && key.endsWith("s")) {
            // Создаем выпадающий список для массива строк
            const select = document.createElement("select");
            select.id = key;
            const baseKey = key.slice(0, -1);
            const hasPairedField = baseKey in obj;
            value.forEach(optionValue => {
                const option = document.createElement("option");
                option.value = optionValue;
                option.textContent = optionValue;

                // Если есть парное поле и значение совпадает, делаем опцию выбранной
                if (hasPairedField && obj[baseKey] === optionValue) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
            select.addEventListener("change", () => {
                obj[baseKey] = select.value;
            });
            div.appendChild(label);
            div.appendChild(select);
        } else {
            // Для других типов данных создаем текстовое поле с отображением типа
            const input = document.createElement("input");
            input.type = "text";
            input.id = key;
            input.value = value.toString();
            input.disabled = true;

            // Добавляем информацию о неподдерживаемом типе
            const info = document.createElement("span");
            // info.textContent = ` (неподдерживаемый тип: ${type})`;
            info.className = "formbinder-error";

            // Добавляем элементы в контейнер
            div.appendChild(label);
            div.appendChild(input);
            div.appendChild(info);
        }

        // Добавляем контейнер в форму
        form.appendChild(div);
    }

    return form;
}

// Пример использования:
/*
// Подключите CSS файл в ваш HTML:
// <link rel="stylesheet" href="formbinder.css">

const myObject = {
  isActive: true,
  name: 'John Doe',
  age: 30,
  score: 100,
  modes: ["easy", "hard", "medium"],
  mode: "hard"
};

const form = createFormBinder(myObject, document);
document.body.appendChild(form);

// Будет создан только один dropdown select для выбора режима
// Значение "hard" будет выбрано по умолчанию
// При изменении выбора в dropdown, значение myObject.mode будет обновляться
*/
