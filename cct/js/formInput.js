import { FormElement } from "shapez/core/modal_dialog_forms";

export class FormCommandInput extends FormElement {
    constructor({ id, placeholder, defaultValue = "", validator = null }) {
        super(id);
        this.placeholder = placeholder;
        this.defaultValue = defaultValue;
        this.validator = validator;

        this.element = null;
    }

    getHtml() {
        return `
            <div class="formCommand input">
                <textarea
                    id="textarea"
                    type="text"
                    spellcheck="false"
                    class="input-text"
                    onkeydown="if(event.keyCode===9) {
                        var v = this.value,
                            s = this.selectionStart,
                            e = this.selectionEnd;
                        this.value = v.substring(0, s) + '    ' + v.substring(e);
                        this.selectionStart = this.selectionEnd = s + 4;
                        return false;
                    }"
                    placeholder="${this.placeholder}"
                    data-formId="${this.id}"
                >${this.defaultValue}</textarea>
            </div>
        `;
    }

    bindEvents(parent, clickTrackers) {
        this.element = this.getFormElement(parent);
        this.element.addEventListener("input", event => this.updateErrorState());
        this.updateErrorState();
    }

    updateErrorState() {
        this.element.classList.toggle("errored", !this.isValid());
    }

    isValid() {
        return !this.validator || this.validator(this.element.value);
    }

    getValue() {
        return this.element.value;
    }

    focus() {
        this.element.focus();
    }
}
