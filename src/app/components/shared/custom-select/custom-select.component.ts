import { Component, forwardRef, OnInit, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
    value: any;
    label: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-custom-select',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './custom-select.component.html',
    styleUrl: './custom-select.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CustomSelectComponent),
            multi: true,
        },
    ],
})
export class CustomSelectComponent implements ControlValueAccessor, OnInit {
    label = input('');
    placeholder = input('Выберите опцию');
    required = input(false);
    disabled = input(false);
    options = input<SelectOption[]>([]);
    errorMessage = input('');
    helpText = input('');

    value = signal<any>(null);
    isDisabled = signal(false);
    isFocused = signal(false);
    isTouched = signal(false);
    isOpen = signal(false);
    selectId: string;

    private onChange = (value: any) => {};
    private onTouched = () => {};

    constructor() {
        this.selectId = `custom-select-${Math.random().toString(36).substr(2, 9)}`;
    }

    ngOnInit() {
        this.isDisabled.set(this.disabled());
    }

    writeValue(value: any): void {
        this.value.set(value);
    }

    registerOnChange(fn: (value: any) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
    }

    toggleDropdown(): void {
        console.log(
            'toggleDropdown called, isDisabled:',
            this.isDisabled(),
            'isOpen:',
            this.isOpen(),
        );
        if (!this.isDisabled()) {
            this.isOpen.set(!this.isOpen());
            if (this.isOpen()) {
                this.isFocused.set(true);
            }
            console.log('Dropdown toggled, new state - isOpen:', this.isOpen());
        }
    }

    selectOption(option: SelectOption): void {
        console.log(
            'selectOption called with:',
            option,
            'disabled states - option:',
            option.disabled,
            'component:',
            this.isDisabled(),
        );
        if (!option.disabled && !this.isDisabled()) {
            console.log('Selecting option, old value:', this.value(), 'new value:', option.value);
            this.value.set(option.value);
            this.isOpen.set(false);
            this.isFocused.set(false);
            this.isTouched.set(true);
            this.onChange(this.value());
            this.onTouched();
            console.log('Option selected successfully, current value:', this.value());
        } else {
            console.log(
                'Option selection blocked - option disabled:',
                option.disabled,
                'component disabled:',
                this.isDisabled(),
            );
        }
    }

    closeDropdown(): void {
        setTimeout(() => {
            console.log('closeDropdown called, current state - isOpen:', this.isOpen());
            this.isOpen.set(false);
            this.isFocused.set(false);
            if (!this.isTouched()) {
                this.isTouched.set(true);
                this.onTouched();
            }
            console.log('Dropdown closed');
        }, 150);
    }

    hasError(): boolean {
        return !!(this.errorMessage() && this.isTouched());
    }

    getSelectedLabel(): string {
        if (this.value() !== null && this.value() !== undefined) {
            const selectedOption = this.options().find(option => option.value === this.value());
            return selectedOption ? selectedOption.label : '';
        }
        return '';
    }

    onKeyDown(event: KeyboardEvent): void {
        if (this.isDisabled()) return;

        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.toggleDropdown();
                break;
            case 'Escape':
                if (this.isOpen()) {
                    this.closeDropdown();
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!this.isOpen()) {
                    this.toggleDropdown();
                } else {
                    this.navigateOptions(1);
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (this.isOpen()) {
                    this.navigateOptions(-1);
                }
                break;
        }
    }

    private navigateOptions(direction: number): void {
        const enabledOptions = this.options().filter(option => !option.disabled);
        if (enabledOptions.length === 0) return;

        let currentIndex = enabledOptions.findIndex(option => option.value === this.value);

        if (currentIndex === -1) {
            currentIndex = direction > 0 ? -1 : enabledOptions.length;
        }

        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < enabledOptions.length) {
            this.selectOption(enabledOptions[newIndex]);
        }
    }

    trackByOptionValue(index: number, option: SelectOption): any {
        return option.value;
    }
}
