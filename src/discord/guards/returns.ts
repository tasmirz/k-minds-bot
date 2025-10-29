export default class Returns {
  public errors: string[] = [];
  public returns: {
    user?: any;
    roles?: string[];
    channel?: any;
  } = {};

  pushErr(error: string): void {
    this.errors.push(error);
  }

  get overall(): boolean {
    return this.errors.length === 0;
  }
}
