import { Component, forwardRef, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-custom-input',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './custom-input.component.html',
    styleUrl: './custom-input.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CustomInputComponent),
            multi: true,
        },
    ],
})
export class CustomInputComponent implements ControlValueAccessor, OnInit {
    label = input('');
    placeholder = input('');
    type = input<'text' | 'email' | 'tel' | 'password'>('text');
    required = input(false);
    disabled = input(false);
    maxLength = input<number | undefined>(undefined);
    minLength = input<number | undefined>(undefined);
    pattern = input<string | undefined>(undefined);
    errorMessage = input('');
    helpText = input('');
    numericOnly = input(false);

    value = signal('');
    isDisabled = signal(false);
    isFocused = signal(false);
    isTouched = signal(false);
    inputId: string;

    private onChange = (value: string) => {};
    private onTouched = () => {};

    constructor() {
        this.inputId = `custom-input-${Math.random().toString(36).substr(2, 9)}`;
    }

    ngOnInit() {
        this.isDisabled.set(this.disabled());
    }

    writeValue(value: string): void {
        this.value.set(value || '');
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
    }

    onInputChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        let newValue = target.value;

        if (this.numericOnly() && this.type() === 'tel') {
            if (newValue.startsWith('+7')) {
                const digitsAfterPrefix = newValue.substring(2).replace(/[^0-9]/g, '');
                newValue = this.formatPhoneInput(digitsAfterPrefix);
            } else {
                newValue = this.formatPhoneInput(newValue);
            }
            target.value = newValue;
        } else if (this.numericOnly()) {
            newValue = newValue.replace(/[^0-9]/g, '');
            target.value = newValue;
        }

        this.value.set(newValue);
        this.onChange(this.value());
    }

    private formatPhoneInput(value: string): string {
        const digits = value.replace(/[^0-9]/g, '');

        const limitedDigits = digits.substring(0, 11);

        if (limitedDigits.length === 0) {
            return '';
        } else if (limitedDigits.length === 1) {
            if (limitedDigits === '8') {
                return '+7 ';
            } else if (limitedDigits === '7') {
                return '+7 ';
            } else {
                return `+7 ${limitedDigits}`;
            }
        } else if (limitedDigits.length <= 4) {
            if (limitedDigits.startsWith('8')) {
                const remainingDigits = limitedDigits.substring(1);
                return `+7 ${remainingDigits}`;
            } else if (limitedDigits.startsWith('7')) {
                const remainingDigits = limitedDigits.substring(1);
                return `+7 ${remainingDigits}`;
            } else {
                return `+7 ${limitedDigits}`;
            }
        } else if (limitedDigits.length <= 7) {
            const processed = this.processCountryCode(limitedDigits);
            const area = processed.substring(0, 3);
            const first = processed.substring(3);
            return `+7 ${area} ${first}`;
        } else if (limitedDigits.length <= 9) {
            const processed = this.processCountryCode(limitedDigits);
            const area = processed.substring(0, 3);
            const first = processed.substring(3, 6);
            const second = processed.substring(6);
            return `+7 ${area} ${first} ${second}`;
        } else {
            const processed = this.processCountryCode(limitedDigits);
            const area = processed.substring(0, 3);
            const first = processed.substring(3, 6);
            const second = processed.substring(6, 8);
            const third = processed.substring(8, 10);
            return `+7 ${area} ${first} ${second} ${third}`.trim();
        }
    }

    private processCountryCode(digits: string): string {
        if (digits.startsWith('7') || digits.startsWith('8')) {
            return digits.substring(1);
        }
        return digits;
    }

    onKeyPress(event: KeyboardEvent): void {
        if (this.numericOnly()) {
            const char = String.fromCharCode(event.which);
            const currentValue = (event.target as HTMLInputElement).value;

            if (this.type() === 'tel' && char === '+' && currentValue.length === 0) {
                return;
            }

            if (!/[0-9]/.test(char) && !this.isControlKey(event)) {
                event.preventDefault();
            }
        }
    }

    private isControlKey(event: KeyboardEvent): boolean {
        return (
            event.key === 'Backspace' ||
            event.key === 'Delete' ||
            event.key === 'Tab' ||
            event.key === 'Escape' ||
            event.key === 'Enter' ||
            event.key === 'Home' ||
            event.key === 'End' ||
            event.key.startsWith('Arrow') ||
            (event.ctrlKey &&
                (event.key === 'a' || event.key === 'c' || event.key === 'v' || event.key === 'x'))
        );
    }

    onFocus(): void {
        this.isFocused.set(true);
    }

    onBlur(): void {
        this.isFocused.set(false);
        this.isTouched.set(true);
        this.onTouched();
    }

    hasError(): boolean {
        return !!(this.errorMessage() && this.isTouched());
    }

    getRemainingChars(): number | null {
        if (this.maxLength()) {
            return this.maxLength()! - this.value().length;
        }
        return null;
    }
}
