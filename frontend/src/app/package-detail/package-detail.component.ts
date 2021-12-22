import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, shareReplay, switchMap } from 'rxjs';
import { MetadataRecord, PackageMetadata, PackagesClient, PresentationPackage } from '../services/api.generated.service';

@Component({
  selector: 'app-package-detail',
  templateUrl: './package-detail.component.html',
  styleUrls: ['./package-detail.component.css']
})
export class PackageDetailComponent implements OnInit {
  presentationPackage$!: Observable<PresentationPackage>;
  metadataDataSource = new MatTableDataSource<PackageMetadata>();

  constructor(
    private packagesClient: PackagesClient,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.presentationPackage$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => this.packagesClient.getPackage(parseInt(params.get('id')!))),
      shareReplay()
    );
    this.presentationPackage$.subscribe(
      (pkg) => {
        console.log(pkg.metadata!);
        this.metadataDataSource.data = pkg.metadata!;
      }
    )
  }

}

export interface PackageDetailData {
  id: number;
  name: string;
  type: string;
  metadata: MetadataData[];
}

export interface MetadataData {
  key: string;
  value: string;
}