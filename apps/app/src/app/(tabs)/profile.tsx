import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { api } from "@/utils/api";

const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const userQuery = api.user.me.useQuery();

  const Header = (
    <View
      className="flex-1 border-zinc-300 dark:border-zinc-800 dark:bg-black"
      style={{
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomWidth: 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{ fontFamily: "BodoniModa_800ExtraBold", fontSize: 40 }}
            className="text-black dark:text-white"
          >
            {userQuery.data?.full_name?.split(" ").at(0)?.toLowerCase()}
          </Text>
          <Text style={{ color: "#999" }}>{userQuery.data?.full_name}</Text>
        </View>
        <Image
          style={{ width: 80, height: 80, borderRadius: 9999 }}
          source="https://picsum.photos/seed/696/3000/2000"
          placeholder={blurhash}
          contentFit="cover"
          transition={1000}
        />
      </View>

      <View style={{ flexDirection: "row", marginTop: 20 }}>
        <Link href="/edit-profile" asChild>
          <Pressable
            style={{
              height: 40,
              paddingHorizontal: 20,
              borderRadius: 9999,
              borderWidth: 1,
              justifyContent: "center",
              marginRight: 10,
            }}
            className="border-black dark:border-white"
          >
            <Text
              style={{ fontWeight: "500" }}
              className="text-black dark:text-white"
            >
              Edit profile
            </Text>
          </Pressable>
        </Link>

        <Link href="/settings" asChild>
          <Pressable
            style={{
              height: 40,
              paddingHorizontal: 20,
              borderRadius: 9999,
              borderWidth: 1,
              justifyContent: "center",
            }}
            className="border-black dark:border-white"
          >
            <Text
              style={{ fontWeight: "500" }}
              className="text-black dark:text-white"
            >
              Settings
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );

  return (
    <>
      <View style={{ height: insets.top }} />
      <FlashList
        ListHeaderComponent={Header}
        renderItem={({ item }) => {
          return null;
        }}
        estimatedItemSize={10}
        data={[]}
      />
    </>
  );
}
