import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptSetupDialogComponent } from './script-setup-dialog.component';

describe('ScriptSetupDialogComponent', () => {
  let component: ScriptSetupDialogComponent;
  let fixture: ComponentFixture<ScriptSetupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScriptSetupDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScriptSetupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
