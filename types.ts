export interface NoteType {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GroupType {
  id:string;
  title: string;
  noteIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isCollapsed: boolean;
}
