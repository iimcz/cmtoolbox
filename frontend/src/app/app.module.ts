import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { PackageListComponent } from './package-list/package-list.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { PackageDetailComponent } from './package-detail/package-detail.component';
import { UserListComponent } from './user-list/user-list.component';
import { AddMetadataComponent } from './add-common-steps/add-metadata/add-metadata.component';
import { AddScriptsComponent } from './add-common-steps/add-scripts/add-scripts.component';
import { AddVideoPackageComponent } from './add-package/add-video-package/add-video-package.component';
import { AddGalleryPackageComponent } from './add-package/add-gallery-package/add-gallery-package.component';
import { AddModelPackageComponent } from './add-package/add-model-package/add-model-package.component';
import { AddScenePackageComponent } from './add-package/add-scene-package/add-scene-package.component';
import { AddScriptComponent } from './add-script/add-script.component';
import { ScriptListComponent } from './script-list/script-list.component';
import { ScriptDetailComponent } from './script-detail/script-detail.component';
import { StatusPageComponent } from './status-page/status-page.component';
import { ScriptSetupDialogComponent } from './dialogs/script-setup-dialog/script-setup-dialog.component';
import { AddLocalUploadComponent } from './add-upload-steps/add-local-upload/add-local-upload.component';
import { HelpSceneImportComponent } from './help/help-scene-import/help-scene-import.component';
import { HelpScriptsComponent } from './help/help-scripts/help-scripts.component';
import { HttpClientModule } from '@angular/common/http';
import { API_BASE_URL } from './services/api.generated.service';
import { environment } from 'src/environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    PackageListComponent,
    UserProfileComponent,
    PackageDetailComponent,
    UserListComponent,
    AddMetadataComponent,
    AddScriptsComponent,
    AddVideoPackageComponent,
    AddGalleryPackageComponent,
    AddModelPackageComponent,
    AddScenePackageComponent,
    AddScriptComponent,
    ScriptListComponent,
    ScriptDetailComponent,
    StatusPageComponent,
    ScriptSetupDialogComponent,
    AddLocalUploadComponent,
    HelpSceneImportComponent,
    HelpScriptsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatStepperModule,
    MatTableModule,
    MatPaginatorModule,
    MatGridListModule,
    MatSortModule,
    MatInputModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    MatSliderModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatDialogModule,
    MatListModule,
    MatSlideToggleModule,
    DragDropModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: API_BASE_URL,
      useValue: environment.apiRoot
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
