import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScriptsComponent } from './add-scripts.component';

describe('AddScriptsComponent', () => {
  let component: AddScriptsComponent;
  let fixture: ComponentFixture<AddScriptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddScriptsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddScriptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
