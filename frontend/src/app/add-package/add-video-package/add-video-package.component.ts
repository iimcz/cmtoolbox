import { BaseCdkCell } from '@angular/cdk/table';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { AddMetadataComponent } from 'src/app/add-common-steps/add-metadata/add-metadata.component';
import { PackagesClient, UnfinishedPackage } from 'src/app/services/api.generated.service';

@Component({
  selector: 'app-add-video-package',
  templateUrl: './add-video-package.component.html',
  styleUrls: ['./add-video-package.component.css']
})
export class AddVideoPackageComponent implements OnInit {
  @ViewChild(AddMetadataComponent) addMetadataComponent!: AddMetadataComponent;

  previewUrl: string = '';
  advancedConversionSettings: boolean = false;
  unfinishedPackage$!: Observable<UnfinishedPackage>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private packagesClient: PackagesClient
  ) { }

  ngOnInit(): void {
    this.unfinishedPackage$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        this.packagesClient.getUnfinishedPackage(parseInt(params.get('id')!)))
    );
  }

  goBack(): void {
    history.back();
  }

  finishAddingPackage(id: number) {
    this.packagesClient.finishPackage(id).subscribe(
      (pkg) => {
        this.router.navigate(['/package', pkg.id]);
      }
    );
  }

  applySimpleConversionParams() {

  }

  applyAdvancedConversionParams() {
    
  }


  triggerSaveMetadata() {
    this.addMetadataComponent.saveAllData();
  }
}
