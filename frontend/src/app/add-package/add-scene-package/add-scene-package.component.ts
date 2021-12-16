import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { PackagesClient, UnfinishedPackage } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-scene-package',
  templateUrl: './add-scene-package.component.html',
  styleUrls: ['./add-scene-package.component.css']
})
export class AddScenePackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;
  unfinishedPackage$!: Observable<UnfinishedPackage>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private packagesClient: PackagesClient
  ) { }

  ngOnInit(): void {
    this.unfinishedPackage$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => this.packagesClient.getUnfinishedPackage(parseInt(params.get('id')!)))
    );
  }


  finishAddingPackage(id: number) {
    this.triggerSaveMetadata();
    this.packagesClient.finishPackage(id).subscribe(
      (pkg) => {
        this.router.navigate(['/package', pkg.id]);
      }
    );
  }

  goBack() {
    history.back();
  }


  triggerSaveMetadata() {
    this.addMetadataComponent.saveAllData();
  }
}
