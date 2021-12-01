import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';import { AddGalleryPackageComponent } from './add-package/add-gallery-package/add-gallery-package.component';
import { AddModelPackageComponent } from './add-package/add-model-package/add-model-package.component';
import { AddMultiresPackageComponent } from './add-package/add-multires-package/add-multires-package.component';
import { AddQuizPackageComponent } from './add-package/add-quiz-package/add-quiz-package.component';
import { AddScenePackageComponent } from './add-package/add-scene-package/add-scene-package.component';
import { AddVideoPackageComponent } from './add-package/add-video-package/add-video-package.component';
import { HelpSceneImportComponent } from './help/help-scene-import/help-scene-import.component';
import { HelpScriptsComponent } from './help/help-scripts/help-scripts.component';
import { PackageDetailComponent } from './package-detail/package-detail.component';
import { PackageListComponent } from './package-list/package-list.component';
import { ScriptListComponent } from './script-list/script-list.component';
import { StatusPageComponent } from './status-page/status-page.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

const routes: Routes = [
  { path: 'packages', component: PackageListComponent },
  { path: 'package/:id', component: PackageDetailComponent },
  { path: 'users', component: UserListComponent },
  { path: 'user', component: UserProfileComponent },
  { path: 'scripts', component: ScriptListComponent },
  { path: 'status', component: StatusPageComponent },

  {
    path: 'add-package', children: [
      { path: 'gallery/:id', component: AddGalleryPackageComponent },
      { path: 'video/:id', component: AddVideoPackageComponent },
      { path: 'map/:id', component: AddMultiresPackageComponent },
      { path: 'scene/:id', component: AddScenePackageComponent },
      { path: 'model/:id', component: AddModelPackageComponent },
      { path: 'quiz/:id', component: AddQuizPackageComponent },
    ]
  },

  {
    path: 'help', children: [
      { path: 'scene-import', component: HelpSceneImportComponent },
      { path: 'scripts', component: HelpScriptsComponent },
    ]
  },

  { path: '', redirectTo: '/packages', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
