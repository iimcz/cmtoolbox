using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using backend.Filters;
using backend.Models;
using backend.Utilities;
using backend.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
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
        private readonly string _targetFilePath;

        private readonly CMTContext _dbContext;

        public FileController(ILogger<FileController> logger, IConfiguration config, CMTContext dbContext)
        {
            _logger = logger;
            _fileSizeLimit = config.GetSection("Files").GetValue<long>("SizeLimit");

            // To save physical files to a path provided by configuration:
            _targetFilePath = config.GetSection("Files").GetValue<string>("StoredPath");

            _permittedExtensions = config.GetSection("Files").GetSection("PermittedExtensions").Get<string[]>();

            // To save physical files to the temporary files folder, use:
            //_targetFilePath = Path.GetTempPath();

            _dbContext = dbContext;
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("upload/{packageId}")]
        [DisableFormValueModelBinding]
        //[ValidateAntiForgeryToken] TODO
        public async Task<IActionResult> Upload(CancellationToken cancellationToken, int packageId)
        {
            if (string.IsNullOrEmpty(Request.ContentType)
                || Request.ContentType.IndexOf("multipart/", StringComparison.OrdinalIgnoreCase) != 0)
            {
                ModelState.AddModelError("File",
                    $"The request couldn't be processed (Error 1).");
                // Log error

                return BadRequest(ModelState);
            }

            var package = await _dbContext.UnfinishedPackages.FindAsync(packageId);
            if (package == null)
            {
                return NotFound();
            }
            var targetDir = package.WorkDir;
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
            await _dbContext.SaveChangesAsync();
            return Created(nameof(FileController), new PackageFile(datafile.Id, Path.GetFileName(uploadedFilename), ""));
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpGet("download/{id}")]
        public async Task<IActionResult> Download(string id)
        {
            bool valid = Guid.TryParse(id, out var fid);

            if (!valid)
            {
                return BadRequest();
            }

            DataFile file = await _dbContext.DataFiles.FindAsync(fid);
            if (file == null)
            {
                return NotFound();
            }

            return File(file.Path, "application/octet-stream");
        }

        [HttpDelete("delete/{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            // TODO: permission check
            var datafile = await _dbContext.DataFiles.FindAsync(id);
            if (datafile == null)
                return NotFound();

            _dbContext.DataFiles.Remove(datafile);
            await _dbContext.SaveChangesAsync();

            System.IO.File.Delete(datafile.Path);

            return Ok();
        }
    }

}