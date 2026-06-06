// 招待リンクを発行できる運営アカウントの許可リスト。
// サーバー側 (Supabase RPC `create_invitation`) でも同じリストでチェックしている。
// 変更時は DB の関数定義も合わせて更新すること。
export const INVITER_EMAILS = ["jinyelingya0619@gmail.com"];
