import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useWorkshopReport } from "@/hooks/useWorkshopReport";

interface WorkshopReportButtonProps {
  workshopId: number;
  token: string;
  workshopName: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function WorkshopReportButton({
  workshopId,
  token,
  workshopName,
  variant = "outline",
  size = "default",
  className = ""
}: WorkshopReportButtonProps) {
  const { downloadReport, isDownloading } = useWorkshopReport();

  const handleDownloadReport = async () => {
    await downloadReport(workshopId, token, workshopName);
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      onClick={handleDownloadReport} 
      disabled={isDownloading}
    >
      <Download className="h-4 w-4 mr-2" />
      {isDownloading ? "Gerando..." : "Relatório Geral"}
    </Button>
  );
}