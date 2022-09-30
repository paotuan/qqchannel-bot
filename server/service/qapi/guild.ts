export class Guild {
  readonly id: string
  readonly name: string
  readonly channels = []
  // todo 成员列表

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
  }
}
