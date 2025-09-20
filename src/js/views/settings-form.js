// Helper function to format field names as labels
function formatLabel(str) {
    return str
        .replaceAll(/([A-Z])/g, " $1") // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .replaceAll("_", " "); // Replace underscores with spaces
}


export default function createBooleanForm(obj, options = {}) {
    // Default options
    const config = {
        formId: "boolean-form",
        containerClass: "form-container",
        fieldClass: "form-field",
        labelClass: "form-label",
        inputClass: "form-input",
        onChange: null, // Callback for when any value changes
        ...options
    };

    // Create form element
    const form = document.createElement("form");
    form.id = config.formId;
    form.className = config.containerClass;

    // Create form fields for each boolean property
    for (const [key, value] of Object.entries(obj)) {
        // const value = obj[key];

        // Validate that the value is boolean
        if (typeof value !== "boolean") {
            // console.warn(`Property "${key}" is not a boolean, skipping...`);
            continue;
        }

        // Create field container
        const fieldDiv = document.createElement("div");
        fieldDiv.className = config.fieldClass;

        // Create checkbox input
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `field-${key}`;
        input.name = key;
        input.checked = value;
        input.className = config.inputClass;

        // Add change event listener to update object immediately
        input.addEventListener("change", (e) => {
            // Update the original object
            obj[key] = e.target.checked;

            // Call custom change handler if provided
            if (config.onChange && typeof config.onChange === "function") {
                config.onChange(key, e.target.checked, obj);
            }
        });

        // Create label
        const label = document.createElement("label");
        label.htmlFor = `field-${key}`;
        label.textContent = formatLabel(key);
        label.className = config.labelClass;

        // Append input and label to field container
        fieldDiv.append(input);
        fieldDiv.append(label);
        form.append(fieldDiv);
    }

    return {
        form: form,
        appendTo: function(container) {
            if (typeof container === "string") {
                container = document.querySelector(container);
            }
            if (container) {
                container.append(form);
            }
            return this;
        },
        destroy: function() {
            form.remove();
        }
    };
}
