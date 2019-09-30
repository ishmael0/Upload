using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Uploader.Controllers
{
    namespace Core.Controllers
    {
        [Route("api/[controller]/[action]")]
        public class UploaderController : Controller
        {
            [HttpPost]
            public JsonResult Upload()
            {
                var Form = HttpContext.Request.Form;
                var File = Form.Files[0];
                var FileName = Form["fileName"][0];
                var Dest = Form["dest"][0];
                var ChunkIndex = int.Parse(Form["chunkIndex"]);
                var ChunkCount = long.Parse(Form["chunkCount"]);
                var FileSize = long.Parse(Form["fileSize"]);
                var loc = "f://";
                var ChunkSize = 2 * 1024 * 1024;//chunk Size
                if (File.Length > 200*1024*1024)//Max File Size = 200MB
                {
                    return Json(StatusCodes.Status403Forbidden);
                }
                //If File exist but the request form tell us that is the first file part
                else if (System.IO.File.Exists(Dest + FileName) && ChunkIndex == 0)
                {
                    return Json(StatusCodes.Status406NotAcceptable);
                }
                //If file not exist and request form tell us that is the first file part
                else if (!System.IO.File.Exists(Dest + FileName) && ChunkIndex == 0)
                {
                    using (var ms = new MemoryStream())
                    {
                        File.CopyTo(ms);
                        var fileBytes = ms.ToArray();
                        using (var output = System.IO.File.Create(loc + Dest + FileName))
                        {
                            output.Write(fileBytes, 0, (int)File.Length);
                        }
                    }
                }
                //If file exist and request form tell us that is not the first file part and we should attack this file to the prev uploaded parts
                else
                {
                    using (var ms = new MemoryStream())
                    {
                        File.CopyTo(ms);
                        var fileBytes = ms.ToArray();
                        using (var output = System.IO.File.OpenWrite(loc + Dest + FileName))
                        {
                            output.Position = ChunkIndex * (ChunkSize);
                            output.Write(fileBytes, 0, (int)File.Length);
                        }
                    }
                }
                return Json(StatusCodes.Status200OK);
            }
            [HttpPost]
            public JsonResult DeleteUnCompletedUpload()
            {
                var loc = "f://";
                var Form = HttpContext.Request.Form;
                var FileName = Form["fileName"][0];
                var Dest = Form["dest"][0];
                if (System.IO.File.Exists(loc + Dest + FileName))
                {
                    System.IO.File.Delete(loc + Dest + FileName);
                }
                return Json(StatusCodes.Status200OK);
            }
        }
    }
}