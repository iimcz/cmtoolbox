import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpProgressEvent, HttpResponse, HttpResponseBase } from "@angular/common/http";
import { Inject, Injectable, InjectionToken, Optional } from "@angular/core";
import { mergeMap as _observableMergeMap, catchError as _observableCatch } from 'rxjs/operators';
import { Observable, throwError as _observableThrow, of as _observableOf } from 'rxjs';
import { ApiException, API_BASE_URL } from "./api.generated.service";

@Injectable({
    providedIn: 'root'
})
export class FileClient {
    private http: HttpClient;
    private baseUrl: string;
    protected jsonParseReviver: ((key: string, value: any) => any) | undefined = undefined;

    constructor(@Inject(HttpClient) http: HttpClient, @Optional() @Inject(API_BASE_URL) baseUrl?: string) {
        this.http = http;
        this.baseUrl = baseUrl !== undefined && baseUrl !== null ? baseUrl : "";
    }

    upload(file: File, packageId: number) : Observable<FileResponse | UploadProgress> {
        let url_ = this.baseUrl + "/File/upload/{packageId}";
        url_ = url_.replace("{packageId}", encodeURIComponent("" + packageId));
        url_ = url_.replace(/[?&]$/, "");

        let formData = new FormData();
        formData.append("file", file, file.name);
        
        let options_: any = {
            body: formData,
            observe: "events",
            responseType: "blob",
            headers: new HttpHeaders(),
            reportProgress: true
        };

        return this.http.request("post", url_, options_).pipe(_observableMergeMap((event_ : any) => {
            return this.processEvent(event_);
        })).pipe(_observableCatch((event_: any) => {
            if (event_ instanceof HttpResponseBase) {
                try {
                    return this.processEvent(<any>event_);
                } catch (e) {
                    return <Observable<FileResponse>><any>_observableThrow(e);
                }
            } else
                return <Observable<FileResponse>><any>_observableThrow(event_);
        }));
    }

    protected processEvent(event: HttpEvent<string>): Observable<FileResponse | UploadProgress> {
        switch (event.type)
        {
            case HttpEventType.Response:
                return this.processUpload(event);
            case HttpEventType.UploadProgress:
                return this.processProgress(event);
        }
        return _observableOf(<any>null);
    }

    protected processProgress(event: HttpProgressEvent): Observable<FileResponse | UploadProgress> {
        return _observableOf(new UploadProgress({uploaded: event.loaded, total: event.total ?? 0}));
    }

    protected processUpload(response: HttpResponseBase): Observable<FileResponse | UploadProgress> {
        const status = response.status;
        const responseBlob =
            response instanceof HttpResponse ? response.body :
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }}
        if (status === 200 || status === 201) {
            return blobToText(responseBlob).pipe(_observableMergeMap((_responseText: string) => {
                let result200: any = null;
                let resultData200 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
                if (Array.isArray(resultData200)) {
                    result200 = [] as any;
                    for (let item of resultData200)
                        result200!.push(FileResponse.fromJS(item));
                }
                else {
                    result200 = FileResponse.fromJS(resultData200);
                }
                return _observableOf(result200);
                }));
        } else if (status !== 200 && status !== 201) {
            return blobToText(responseBlob).pipe(_observableMergeMap((_responseText: string) => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<FileResponse>(<any>null);
    }

    delete(id: number) : Observable<void> {
        let url_ = this.baseUrl + "/File/delete/{id}";
        url_ = url_.replace("{id}", encodeURIComponent("" + id));
        url_ = url_.replace(/[?&]$/, "");
        
        let options_ : any = {
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Accept": "application/json"
            })
        };

        return this.http.request("delete", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processDelete(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processDelete(<any>response_);
                } catch (e) {
                    return <Observable<void>><any>_observableThrow(e);
                }
            } else
                return <Observable<void>><any>_observableThrow(response_);
        }));
    }

    protected processDelete(response: HttpResponseBase): Observable<void>
    {
        const status = response.status;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }}
        if (status === 200) {
            return _observableOf(undefined);
        } else if (status !== 200 && status !== 204) {
            return throwException("An unexpected server error occurred.", status, "", _headers);
        }
        return _observableOf(undefined);
    }

    getFileThumbnailUrl(id: number): string {
        return (this.baseUrl + "/File/thumbnail/file/{id}").replace("{id}", encodeURIComponent("" + id));
    }

    getPackageThumbnailUrl(id: number): string {
        return (this.baseUrl + "/File/thumbnail/package/{id}").replace("{id}", encodeURIComponent("" + id));
    }

    getPreviewUrl(id: number): string {
        return (this.baseUrl + "/File/preview/{id}").replace("{id}", encodeURIComponent("" + id));
    }

    // TODO: Consider moving this elsewhere
    getPackageDownloadUrl(id: number): string {
        return (this.baseUrl + "/Packages/download/{id}").replace("{id}", encodeURIComponent("" + id));
    }
}

export interface IFileResponse {
    id?: number;
    filename?: string;
}

export class FileResponse implements IFileResponse {
    id?: number;
    filename?: string;

    constructor(data?: IFileResponse) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(_data?: any) {
        if (_data) {
            this.id = _data["id"];
            this.filename = _data["filename"];
        }
    }

    static fromJS(data: any): FileResponse {
        data = typeof data === 'object' ? data : {};
        let result = new FileResponse();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["id"] = this.id;
        data["filename"] = this.filename;
        return data; 
    }
}

export interface IUploadProgress {
    uploaded?: number;
    total?: number;
}

export class UploadProgress implements IUploadProgress {
    uploaded?: number;
    total?: number;

    constructor(data?: IUploadProgress) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(_data?: any) {
        if (_data) {
            this.uploaded = _data["uploaded"];
            this.total = _data["total"];
        }
    }

    static fromJS(data: any): FileResponse {
        data = typeof data === 'object' ? data : {};
        let result = new FileResponse();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["uploaded"] = this.uploaded;
        data["total"] = this.total;
        return data; 
    }
}

function throwException(message: string, status: number, response: string, headers: { [key: string]: any; }, result?: any): Observable<any> {
    if (result !== null && result !== undefined)
        return _observableThrow(result);
    else
        return _observableThrow(new ApiException(message, status, response, headers, null));
}

function blobToText(blob: any): Observable<string> {
    return new Observable<string>((observer: any) => {
        if (!blob) {
            observer.next("");
            observer.complete();
        } else {
            let reader = new FileReader();
            reader.onload = event => {
                observer.next((<any>event.target).result);
                observer.complete();
            };
            reader.readAsText(blob);
        }
    });
}