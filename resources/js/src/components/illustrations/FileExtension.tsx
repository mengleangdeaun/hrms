import JPGSvg from '@/assets/illustrations/JPG.svg';
import PDFSvg from '@/assets/illustrations/PDF.svg';
import CSVSvg from '@/assets/illustrations/CSV.svg';
import PNGSvg from '@/assets/illustrations/PNG.svg';
import ExcelSvg from '@/assets/illustrations/XSL.svg';
import DOCXSvg from '@/assets/illustrations/DOC.svg';
import ZipSvg from '@/assets/illustrations/ZIP.svg';
import TXTSvg from '@/assets/illustrations/TXT.svg';
import MP4Svg from '@/assets/illustrations/MP4.svg';
import MP3Svg from '@/assets/illustrations/MP3.svg';
import PPTSvg from '@/assets/illustrations/PPT.svg';
import SVG from '@/assets/illustrations/SVG.svg';
import TIFF from '@/assets/illustrations/TIFF.svg';
import GIFF from '@/assets/illustrations/GIFF.svg';

const fileIconMap: Record<string, string> = {
  jpg: JPGSvg,
  jpeg: JPGSvg,
  png: PNGSvg,
  pdf: PDFSvg,
  csv: CSVSvg,
  xls: ExcelSvg,
  xlsx: ExcelSvg,
  doc: DOCXSvg,
  docx: DOCXSvg,
  zip: ZipSvg,
  txt: TXTSvg,
  mp4: MP4Svg,
  mp3: MP3Svg,
  ppt: PPTSvg,
  pptx: PPTSvg,
  svg: SVG,
  tiff: TIFF,
  gif: GIFF,
};

type FileIconProps = {
  type?: string;
  ext?: string;
  size?: number;
  className?: string;
};

export const FileIcon = ({ type = 'txt', ext, size, className }: FileIconProps) => {
  const iconType = (ext || type).toLowerCase();
  const icon = fileIconMap[iconType] || TXTSvg;

  return (
    <div className={className}>
      <img
        src={icon}
        alt={`${iconType} file icon`}
        style={size ? { width: size, height: size } : undefined}
        className="w-full h-full object-contain"
      />
    </div>
  );
};