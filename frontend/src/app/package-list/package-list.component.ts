import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { FileClient } from '../services/api';
import { PackagesClient } from '../services/api.generated.service';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.css']
})
export class PackageListComponent implements OnInit, AfterViewInit {
  searchTerm: string = "";

  displayedColumns: string[] = ['img', 'id', 'label', 'desc'];
  pkgDataSource = new MatTableDataSource<Package>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private packagesClient: PackagesClient,
    private fileClient: FileClient
  ) { }

  ngAfterViewInit(): void {
    this.pkgDataSource.filterPredicate = this.doFilter;
  }

  ngOnInit(): void {
    this.packagesClient.getPackages().subscribe(
      (packages) => {
        this.pkgDataSource.paginator = this.paginator;
        this.pkgDataSource.sort = this.sort;
        this.pkgDataSource.data = packages.map(
          (pkg): Package => ({ id: pkg.id!, label: pkg.name!, desc: pkg.description!, thumbUrl: this.fileClient.getPackageThumbnailUrl(pkg.id!) })
        );
      }
    )
  }

  navigatePackage(item: Package) {
    this.router.navigate(['/package', item.id]);
  }

  doFilter(item: Package, filter: string): boolean {
    filter = filter.toLowerCase();
    if (item.label!.toLowerCase().indexOf(filter) >= 0) {
      return true;
    }
    if (item.desc!.toLowerCase().indexOf(filter) >= 0) {
      return true;
    }
    return false;
  }

}

export interface Package {
  id: number;
  label: string;
  desc: string;
  thumbUrl: string;
}
