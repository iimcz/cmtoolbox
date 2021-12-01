using Microsoft.AspNetCore.Mvc;

namespace backend.ViewModels
{
    internal class CreatedUnfinishedPackage
    {
        public CreatedUnfinishedPackage(int iD)
        {
            ID = iD;
        }

        public int ID { get; }
    }
}