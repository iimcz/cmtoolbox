import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddQuizPackageComponent } from './add-quiz-package.component';

describe('AddQuizPackageComponent', () => {
  let component: AddQuizPackageComponent;
  let fixture: ComponentFixture<AddQuizPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddQuizPackageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddQuizPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
