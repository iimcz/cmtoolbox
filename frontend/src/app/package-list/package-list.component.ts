import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { PackagesClient } from '../services/api.generated.service';

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.css']
})
export class PackageListComponent implements OnInit, AfterViewInit {
  searchTerm: string = "";

  displayedColumns: string[] = ['id', 'label', 'desc'];
  pkgDataSource = new MatTableDataSource<Package>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private packagesClient: PackagesClient
  ) { }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.packagesClient.getPackages().subscribe(
      (packages) => {
        this.pkgDataSource.paginator = this.paginator;
        this.pkgDataSource.sort = this.sort;
        this.pkgDataSource.data = packages.map(
          (pkg): Package => ({ id: pkg.id!, label: pkg.name!, desc: pkg.description!, thumbUrl: "" })
        );
      }
    )
  }

  navigatePackage(item: Package) {
    this.router.navigate(['/package', item.id]);
  }

}

export interface Package {
  id: number;
  label: string;
  desc: string;
  thumbUrl: string;
}
