import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpScriptsComponent } from './help-scripts.component';

describe('ScriptsComponent', () => {
  let component: HelpScriptsComponent;
  let fixture: ComponentFixture<HelpScriptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HelpScriptsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpScriptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
