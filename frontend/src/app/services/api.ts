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
            headers: new HttpHeaders()
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
        return _observableOf({uploaded: event.loaded, total: event.total ?? 0});
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
                    result200 = <any>null;
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
}

export interface IFileResponse {
    id?: string;
}

export class FileResponse implements IFileResponse {
    id?: string;

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
        return data; 
    }
}

export interface UploadProgress {
    uploaded: number;
    total: number;
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