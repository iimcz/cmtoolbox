import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpSceneImportComponent } from './help-scene-import.component';

describe('SceneImportComponent', () => {
  let component: HelpSceneImportComponent;
  let fixture: ComponentFixture<HelpSceneImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HelpSceneImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpSceneImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
