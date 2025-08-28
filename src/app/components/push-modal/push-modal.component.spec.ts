import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushModalComponent } from './push-modal.component';

describe('PushModalComponent', () => {
    let component: PushModalComponent;
    let fixture: ComponentFixture<PushModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PushModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PushModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
