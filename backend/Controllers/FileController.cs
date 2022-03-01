using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using backend.Filters;
using backend.Models;
using backend.Utilities;
using backend.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class FileController : ControllerBase
    {
        private readonly long _fileSizeLimit;
        private readonly ILogger<FileController> _logger;
        private readonly string[] _permittedExtensions = { };
        private readonly string[] _thumbnailExtensions = { ".png", ".jpg", ".avi", ".mp4", ".webm" };
        private readonly string[] _previewExtensions = { ".avi", ".mp4", ".webm" };

        private readonly CMTContext _dbContext;
        private readonly string _basePackageDir;

        public FileController(ILogger<FileController> logger, IConfiguration config, CMTContext dbContext)
        {
            _logger = logger;
            _fileSizeLimit = config.GetSection("Files").GetValue<long>("SizeLimit");
            _permittedExtensions = config.GetSection("Files").GetSection("PermittedExtensions").Get<string[]>();

            _dbContext = dbContext;
            _basePackageDir = config.GetSection("Packages").GetValue<string>("BaseStorageDir");
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("upload/{packageId}")]
        [DisableFormValueModelBinding]
        [DisableRequestSizeLimit]
        //[ValidateAntiForgeryToken] TODO
        public async Task<ActionResult> Upload(CancellationToken cancellationToken, int packageId)
        {
            if (string.IsNullOrEmpty(Request.ContentType)
                || Request.ContentType.IndexOf("multipart/", StringComparison.OrdinalIgnoreCase) != 0)
            {
                ModelState.AddModelError("File",
                    $"The request couldn't be processed (Error 1).");
                // Log error

                return BadRequest(ModelState);
            }

            var package = await _dbContext.PresentationPackages.FindAsync(packageId);
            if (package == null)
            {
                return NotFound();
            }
            var targetDir = Path.Combine(package.WorkDir, "upload");
            Directory.CreateDirectory(targetDir);

            string uploadedFilename = null;

            var boundary = Request.GetMultipartBoundary();
            var reader = new MultipartReader(boundary, HttpContext.Request.Body);
            var section = await reader.ReadNextSectionAsync(cancellationToken);

            while (section != null)
            {
                var hasContentDispositionHeader =
                    ContentDispositionHeaderValue.TryParse(
                        section.ContentDisposition, out var contentDisposition);

                if (hasContentDispositionHeader)
                {
                    // This check assumes that there's a file
                    // present without form data. If form data
                    // is present, this method immediately fails
                    // and returns the model error.
                    if (!MultipartRequestHelper
                        .HasFileContentDisposition(contentDisposition))
                    {
                        ModelState.AddModelError("File",
                            $"The request couldn't be processed (Error 2).");
                        // Log error

                        return BadRequest(ModelState);
                    }
                    else
                    {
                        // Don't trust the file name sent by the client. To display
                        // the file name, HTML-encode the value.
                        var trustedFileNameForDisplay = WebUtility.HtmlEncode(
                                contentDisposition.FileName.Value);

                        // ^ The above holds, but for testing purposes, don't change the filename yet.
                        //var trustedFileNameForFileStorage = Path.Combine(Path.GetRandomFileName(), Path.GetExtension(contentDisposition.FileName.Value));
                        var trustedFileNameForFileStorage = contentDisposition.FileName.Value;

                        // **WARNING!**
                        // In the following example, the file is saved without
                        // scanning the file's contents. In most production
                        // scenarios, an anti-virus/anti-malware scanner API
                        // is used on the file before making the file available
                        // for download or for use by other systems. 
                        // For more information, see the topic that accompanies 
                        // this sample.

                        var streamedFileContent = await FileHelpers.ProcessStreamedFile(
                            section, contentDisposition, ModelState,
                            _permittedExtensions, _fileSizeLimit);
                        
                        if (!ModelState.IsValid)
                        {
                            return BadRequest(ModelState);
                        }

                        uploadedFilename = Path.Combine(targetDir, trustedFileNameForFileStorage);
                        using (var targetStream = System.IO.File.Create(
                            uploadedFilename))
                        {
                            await targetStream.WriteAsync(streamedFileContent, cancellationToken);

                            _logger.LogInformation(
                                "Uploaded file '{TrustedFileNameForDisplay}' saved to " +
                                "'{TargetFilePath}' as {TrustedFileNameForFileStorage}",
                                trustedFileNameForDisplay, targetDir,
                                trustedFileNameForFileStorage);
                        }
                    }
                }

                // Drain any remaining section body that hasn't been consumed and
                // read the headers for the next section.
                section = await reader.ReadNextSectionAsync(cancellationToken);
            }

            var datafile = new DataFile() { Path = uploadedFilename };
            if (package.DataFiles == null)
                package.DataFiles = new List<DataFile>();
            package.DataFiles.Add(datafile);

            if (_thumbnailExtensions.Any(s => s == Path.GetExtension(datafile.Path)))
            {
                var thumbnailDir = Path.Combine(package.WorkDir, "thumbnails");
                Directory.CreateDirectory(thumbnailDir);
                datafile.ThumbnailPath = await FileHelpers.GenerateThumbnail(
                    datafile.Path,
                    thumbnailDir
                );
            }
            if (_previewExtensions.Any(s => s == Path.GetExtension(datafile.Path)))
            {
                var previewDir = Path.Combine(package.WorkDir, "previews");
                Directory.CreateDirectory(previewDir);
                datafile.PreviewPath = Path.Combine(previewDir, Path.GetFileName(datafile.Path));
            }

            await _dbContext.SaveChangesAsync();
            return Created(nameof(FileController), 
                new PackageFile(datafile.Id, Path.GetFileName(uploadedFilename)));
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [ResponseCache(NoStore = true)]
        [HttpGet("preview/{id}")]
        public async Task<ActionResult> DownloadPreview(int id)
        {
            var datafile = await _dbContext.DataFiles.FindAsync(id);
            if (datafile == null)
                return NotFound();
            if (!System.IO.File.Exists(datafile.PreviewPath))
                return NotFound();

            return Download(datafile.PreviewPath);
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpDelete("delete/{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            // TODO: permission check
            var datafile = await _dbContext.DataFiles.FindAsync(id);
            if (datafile == null)
                return NotFound();
            if (!System.IO.File.Exists(datafile.Path))
            {
                _logger.LogWarning("Database contains a non-existent data file: {0}", datafile.Path);
                return NotFound();
            }

            _dbContext.DataFiles.Remove(datafile);
            await _dbContext.SaveChangesAsync();

            System.IO.File.Delete(datafile.Path);

            return Ok();
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpGet("thumbnail/file/{id}")]
        public async Task<ActionResult> DownloadFileThumbnail(int id)
        {
            var datafile = await _dbContext.DataFiles.FindAsync(id);
            if (datafile == null)
                return NotFound();
            if (!System.IO.File.Exists(datafile.ThumbnailPath))
                return NotFound();

            return Download(datafile.ThumbnailPath);
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpGet("thumbnail/package/{id}")]
        public async Task<ActionResult> DownloadPackageThumbnail(int id)
        {
            var package = await _dbContext.PresentationPackages.FindAsync(id);
            if (package == null)
                return NotFound();
            var path = Path.Combine(_basePackageDir, $"{id}", "thumbnail.png");
            if (!System.IO.File.Exists(path))
                return NotFound();

            return Download(path);
        }

        private ActionResult Download(string path)
        {
            var contentTypeProvider = new FileExtensionContentTypeProvider();
            contentTypeProvider.TryGetContentType(path, out var contentType);
            var stream = new FileStream(Path.Combine(Directory.GetCurrentDirectory(), path), FileMode.Open);
            return File(stream, contentType);
        }
    }

}